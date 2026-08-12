"""Canonical capability-manifest adapter and runtime authorization snapshot."""

import json
from copy import deepcopy
from pathlib import Path
from types import MappingProxyType
from typing import Dict, List, Mapping


REQUIRED_RUNTIME_FIELDS = {
    "capability_id",
    "version",
    "architectural_type",
    "available_runtime",
    "current_status",
    "read_or_write",
    "authorization_scope",
    "approval_requirement",
    "data_boundary",
    "last_verified",
}


class CapabilityUnavailable(ValueError):
    """Raised when a requested capability is absent or outside its contract."""


class CapabilityRegistry:
    def __init__(self, records: Dict[str, dict]) -> None:
        self._records = records

    @classmethod
    def load(cls, path: Path) -> "CapabilityRegistry":
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
        if (
            type(payload.get("schema_version")) is not int
            or payload["schema_version"] != 2
        ):
            raise ValueError("manifest schema_version must be 2")
        records: Dict[str, dict] = {}
        for capability in payload.get("capabilities", []):
            runtime = capability.get("runtime_contract", {})
            missing = REQUIRED_RUNTIME_FIELDS - set(runtime)
            capability_id = capability.get("id", "<unknown>")
            if missing or runtime.get("capability_id") != capability_id:
                raise ValueError(
                    f"invalid runtime contract for {capability_id}: {sorted(missing)}"
                )
            records[capability_id] = deepcopy(runtime)
        return cls(records)

    def snapshot(
        self,
        capability_ids: List[str],
        runtime: str,
        requested_actions: List[str],
        requested_data: List[str] = None,
    ) -> Mapping[str, Mapping[str, object]]:
        selected: Dict[str, Mapping[str, object]] = {}
        for capability_id in capability_ids:
            if capability_id not in self._records:
                raise CapabilityUnavailable(f"{capability_id}: unknown capability")
            contract = self._records[capability_id]
            if contract["available_runtime"] != runtime:
                raise CapabilityUnavailable(
                    f"{capability_id}: unavailable in runtime {runtime}"
                )
            if contract["current_status"] != "packaged":
                raise CapabilityUnavailable(f"{capability_id}: not packaged")
            access = contract["read_or_write"]
            for action in requested_actions:
                if action == "write" and access not in {"write", "read_write"}:
                    raise CapabilityUnavailable(f"{capability_id}: write not authorized")
                if action in {"read", "analyze"} and access not in {"read", "read_write"}:
                    raise CapabilityUnavailable(f"{capability_id}: read not authorized")
            if requested_data:
                denied = set(requested_data) - set(contract["data_boundary"])
                if denied:
                    raise CapabilityUnavailable(
                        f"{capability_id}: data boundary rejects {sorted(denied)}"
                    )
            selected[capability_id] = MappingProxyType(deepcopy(contract))
        return MappingProxyType(selected)
