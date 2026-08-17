"""G2-02: bounded, versioned, loopback-only Runtime read API.

This module deliberately exposes no mutation, execution, file-write, SQL, or
network-proxy routes. G2-03 adds paired credentials; until then every data
endpoint requires the locally configured owner header and only binds loopback.
"""
from __future__ import annotations

from dataclasses import dataclass
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import PurePosixPath
import sqlite3
from typing import Any, Callable, Mapping
from urllib.parse import parse_qs, urlparse

from .audit_chain import verify_chain
from .database import database_health
from .schema_migrations import initialize_runtime_connection
from .status import MissionStatusAccessError, MissionStatusRepository

API_VERSION = "v1"
MAX_PAGE_SIZE = 100
MAX_RESPONSE_BYTES = 1_048_576
OWNER_HEADER = "X-Seraphim-Owner"


class ApiConfigurationError(ValueError):
    """Raised when a server configuration would expand the API boundary."""


class ApiRequestError(ValueError):
    """Raised for rejected untrusted request syntax or pagination."""


class ApiAccessError(LookupError):
    """Raised when a request is not authorized for the configured owner."""


@dataclass(frozen=True)
class LoopbackApiConfig:
    owner_id: str
    host: str = "127.0.0.1"
    port: int = 8765

    def __post_init__(self) -> None:
        if not isinstance(self.owner_id, str) or not self.owner_id.strip():
            raise ApiConfigurationError("owner_id is required")
        if self.host != "127.0.0.1":
            raise ApiConfigurationError("G2-02 permits only 127.0.0.1 binding")
        if isinstance(self.port, bool) or not isinstance(self.port, int) or not 0 <= self.port <= 65535:
            raise ApiConfigurationError("port must be between 0 and 65535")


ConnectionFactory = Callable[[], sqlite3.Connection]


class RuntimeReadOnlyApi:
    """Route dispatcher with an intentionally fixed, read-only contract."""

    _MISSION_TABLES: Mapping[str, tuple[str, str]] = {
        "tasks": ("runtime_tasks", "task_id"),
        "dependencies": ("runtime_task_dependencies", "task_id"),
        "approvals": ("runtime_approval_requests", "task_id"),
        "claims": ("runtime_task_claims", "task_id"),
        "attempts": ("runtime_attempts", "task_id"),
    }
    _SENSITIVE_FIELD_PARTS = (
        "token",
        "secret",
        "private",
        "protected",
        "key_material",
        "owner_id",
        "parameters_json",
        "rollback_metadata_json",
        "input_metadata_json",
        "payload_json",
    )

    def __init__(self, config: LoopbackApiConfig, connection_factory: ConnectionFactory) -> None:
        self._config = config
        self._connection_factory = connection_factory

    def get(self, raw_path: str, headers: Mapping[str, str]) -> tuple[int, dict[str, Any]]:
        parsed = urlparse(raw_path)
        if parsed.scheme or parsed.netloc or not parsed.path.startswith(f"/{API_VERSION}/"):
            return self._error(HTTPStatus.NOT_FOUND, "unknown_route")
        if self._has_mutation_query(parsed.query):
            return self._error(HTTPStatus.BAD_REQUEST, "malformed_query")

        if parsed.path == f"/{API_VERSION}/health":
            return self._health()

        try:
            self._require_owner(headers)
            return self._authorized_get(parsed.path, parse_qs(parsed.query, keep_blank_values=True, strict_parsing=True))
        except ApiAccessError:
            return self._error(HTTPStatus.FORBIDDEN, "owner_scope_required")
        except (ApiRequestError, ValueError) as error:
            return self._error(HTTPStatus.BAD_REQUEST, str(error))
        except (LookupError, MissionStatusAccessError):
            return self._error(HTTPStatus.NOT_FOUND, "mission_not_found")
        except sqlite3.DatabaseError:
            return self._error(HTTPStatus.SERVICE_UNAVAILABLE, "runtime_unavailable")

    def _health(self) -> tuple[int, dict[str, Any]]:
        try:
            connection = self._connection_factory()
            try:
                initialize_runtime_connection(connection)
                health = database_health(connection)
                chain = verify_chain(connection)
            finally:
                connection.close()
            return self._respond(
                HTTPStatus.OK,
                {
                    "api_version": API_VERSION,
                    "mode": "read_only",
                    "loopback_only": True,
                    "file_writes_enabled": False,
                    "external_execution_enabled": False,
                    "runtime": health,
                    "audit_chain": {"valid": chain.valid, "reason": chain.reason},
                },
            )
        except sqlite3.DatabaseError:
            return self._error(HTTPStatus.SERVICE_UNAVAILABLE, "runtime_unavailable")

    def _authorized_get(self, path: str, query: Mapping[str, list[str]]) -> tuple[int, dict[str, Any]]:
        components = PurePosixPath(path).parts
        # ('/', 'v1', 'missions', '<mission>', ...)
        if components == ("/", API_VERSION, "missions"):
            return self._missions(query)
        if len(components) < 4 or components[1:3] != (API_VERSION, "missions"):
            return self._error(HTTPStatus.NOT_FOUND, "unknown_route")

        mission_id = components[3]
        suffix = components[4:]
        if not mission_id or any(part in {".", ".."} for part in components):
            raise ApiRequestError("malformed_path")
        if suffix == ("status",):
            return self._mission_status(mission_id, query)
        if suffix == ("audit", "verify"):
            return self._audit_verification(mission_id, query)
        if len(suffix) == 1 and suffix[0] in self._MISSION_TABLES:
            return self._mission_collection(mission_id, suffix[0], query)
        return self._error(HTTPStatus.NOT_FOUND, "unknown_route")

    def _missions(self, query: Mapping[str, list[str]]) -> tuple[int, dict[str, Any]]:
        limit, offset = self._pagination(query)
        connection = self._connection_factory()
        try:
            initialize_runtime_connection(connection)
            rows = connection.execute(
                "SELECT mission_id, title, objective, status, created_at FROM runtime_missions "
                "WHERE owner_id = ? ORDER BY created_at ASC, mission_id ASC LIMIT ? OFFSET ?",
                (self._config.owner_id, limit, offset),
            ).fetchall()
            return self._respond(HTTPStatus.OK, self._page([self._public_row(row) for row in rows], limit, offset))
        finally:
            connection.close()

    def _mission_status(self, mission_id: str, query: Mapping[str, list[str]]) -> tuple[int, dict[str, Any]]:
        self._assert_no_pagination(query)
        connection = self._connection_factory()
        try:
            initialize_runtime_connection(connection)
            status = MissionStatusRepository(connection).get(self._config.owner_id, mission_id).as_dict()
            return self._respond(HTTPStatus.OK, self._public_value(status))
        finally:
            connection.close()

    def _audit_verification(self, mission_id: str, query: Mapping[str, list[str]]) -> tuple[int, dict[str, Any]]:
        self._assert_no_pagination(query)
        connection = self._connection_factory()
        try:
            initialize_runtime_connection(connection)
            self._assert_owned_mission(connection, mission_id)
            verification = verify_chain(connection)
            return self._respond(
                HTTPStatus.OK,
                {
                    "mission_id": mission_id,
                    "audit_chain": {
                        "valid": verification.valid,
                        "first_broken_sequence": verification.first_broken_sequence,
                        "reason": verification.reason,
                    },
                },
            )
        finally:
            connection.close()

    def _mission_collection(self, mission_id: str, collection: str, query: Mapping[str, list[str]]) -> tuple[int, dict[str, Any]]:
        limit, offset = self._pagination(query)
        table, _ = self._MISSION_TABLES[collection]
        connection = self._connection_factory()
        try:
            initialize_runtime_connection(connection)
            self._assert_owned_mission(connection, mission_id)
            if collection == "dependencies":
                sql = (
                    f"SELECT * FROM {table} WHERE task_id IN "
                    "(SELECT task_id FROM runtime_tasks WHERE mission_id = ?) "
                    "ORDER BY created_at ASC LIMIT ? OFFSET ?"
                )
            else:
                sql = (
                    f"SELECT * FROM {table} WHERE task_id IN "
                    "(SELECT task_id FROM runtime_tasks WHERE mission_id = ?) "
                    "ORDER BY created_at ASC LIMIT ? OFFSET ?"
                )
            rows = connection.execute(sql, (mission_id, limit, offset)).fetchall()
            return self._respond(HTTPStatus.OK, self._page([self._public_row(row) for row in rows], limit, offset))
        finally:
            connection.close()

    def _assert_owned_mission(self, connection: sqlite3.Connection, mission_id: str) -> None:
        row = connection.execute(
            "SELECT 1 FROM runtime_missions WHERE mission_id = ? AND owner_id = ?",
            (mission_id, self._config.owner_id),
        ).fetchone()
        if row is None:
            raise LookupError("mission not found")

    def _require_owner(self, headers: Mapping[str, str]) -> None:
        supplied = next((value for key, value in headers.items() if key.lower() == OWNER_HEADER.lower()), None)
        if supplied != self._config.owner_id:
            raise ApiAccessError("owner scope required")

    @staticmethod
    def _has_mutation_query(raw_query: str) -> bool:
        return raw_query.count("=") > 2 or "[" in raw_query or "]" in raw_query

    @staticmethod
    def _pagination(query: Mapping[str, list[str]]) -> tuple[int, int]:
        unknown = set(query).difference({"limit", "offset"})
        if unknown:
            raise ApiRequestError("unknown_query_parameter")
        if any(len(values) != 1 for values in query.values()):
            raise ApiRequestError("duplicate_query_parameter")
        try:
            limit = int(query.get("limit", ["50"])[0])
            offset = int(query.get("offset", ["0"])[0])
        except ValueError as error:
            raise ApiRequestError("invalid_pagination") from error
        if not 1 <= limit <= MAX_PAGE_SIZE or offset < 0:
            raise ApiRequestError("invalid_pagination")
        return limit, offset

    @staticmethod
    def _assert_no_pagination(query: Mapping[str, list[str]]) -> None:
        if query:
            raise ApiRequestError("query_not_supported")

    @staticmethod
    def _page(items: list[dict[str, Any]], limit: int, offset: int) -> dict[str, Any]:
        return {"items": items, "limit": limit, "offset": offset, "next_offset": offset + len(items) if len(items) == limit else None}

    def _public_row(self, row: sqlite3.Row | tuple[Any, ...]) -> dict[str, Any]:
        if isinstance(row, sqlite3.Row):
            return self._public_value(dict(row))
        return self._public_value(dict(enumerate(row)))

    def _public_value(self, value: Any) -> Any:
        if isinstance(value, dict):
            return {
                str(key): self._public_value(item)
                for key, item in value.items()
                if not any(part in str(key).lower() for part in self._SENSITIVE_FIELD_PARTS)
            }
        if isinstance(value, (list, tuple)):
            return [self._public_value(item) for item in value]
        return value

    def _respond(self, status: HTTPStatus, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        if len(encoded) > MAX_RESPONSE_BYTES:
            return self._error(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "response_too_large")
        return int(status), payload

    @staticmethod
    def _error(status: HTTPStatus, code: str) -> tuple[int, dict[str, Any]]:
        return int(status), {"api_version": API_VERSION, "error": {"code": code}}


class _Handler(BaseHTTPRequestHandler):
    api: RuntimeReadOnlyApi

    def do_GET(self) -> None:  # noqa: N802
        status, payload = self.api.get(self.path, self.headers)
        body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:  # noqa: N802
        self._method_not_allowed()

    do_PUT = do_POST
    do_PATCH = do_POST
    do_DELETE = do_POST
    do_HEAD = do_POST
    do_OPTIONS = do_POST
    do_CONNECT = do_POST
    do_TRACE = do_POST

    def _method_not_allowed(self) -> None:
        body = json.dumps({"api_version": API_VERSION, "error": {"code": "read_only_api"}}).encode("utf-8")
        self.send_response(HTTPStatus.METHOD_NOT_ALLOWED)
        self.send_header("Allow", "GET")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format: str, *_args: object) -> None:
        return


def create_loopback_server(config: LoopbackApiConfig, connection_factory: ConnectionFactory) -> ThreadingHTTPServer:
    """Create, but do not start, a server restricted to the loopback interface."""
    api = RuntimeReadOnlyApi(config, connection_factory)

    class BoundHandler(_Handler):
        pass

    BoundHandler.api = api
    return ThreadingHTTPServer((config.host, config.port), BoundHandler)
