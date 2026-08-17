"""Evidence-preserving legacy-file migration support for G1-02."""

from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


class LegacyMigrationError(RuntimeError):
    pass


@dataclass(frozen=True)
class EvidenceItem:
    source: str
    destination: str
    sha256: str
    size: int


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


class LegacyEvidenceMigrator:
    """Copies selected legacy evidence without deleting or rewriting sources.

    The state file is written atomically. A repeated invocation reconciles files
    already copied by hash, allowing safe restart after interruption.
    """

    def __init__(self, destination_root: Path) -> None:
        self.destination_root = destination_root.resolve(strict=False)
        self.raw_root = self.destination_root / "raw"
        self.state_path = self.destination_root / "migration-state.json"

    def inventory(self, sources: Iterable[Path]) -> list[EvidenceItem]:
        items: list[EvidenceItem] = []
        for source in sources:
            source = source.resolve(strict=True)
            if not source.is_file():
                raise LegacyMigrationError(f"Legacy evidence is not a file: {source}")
            digest = file_hash(source)
            destination = self.raw_root / f"{digest}-{source.name}"
            items.append(EvidenceItem(str(source), str(destination), digest, source.stat().st_size))
        return items

    def migrate(self, sources: Iterable[Path], interrupt_after: int | None = None) -> dict[str, object]:
        items = self.inventory(sources)
        self.raw_root.mkdir(parents=True, exist_ok=True)
        completed: list[EvidenceItem] = []
        for index, item in enumerate(items, start=1):
            destination = Path(item.destination)
            if destination.exists():
                if file_hash(destination) != item.sha256:
                    raise LegacyMigrationError(f"Destination hash conflict: {destination}")
            else:
                with tempfile.NamedTemporaryFile(dir=self.raw_root, delete=False) as temporary:
                    temporary_path = Path(temporary.name)
                try:
                    shutil.copyfile(item.source, temporary_path)
                    if file_hash(temporary_path) != item.sha256:
                        raise LegacyMigrationError(f"Copy hash mismatch: {item.source}")
                    temporary_path.replace(destination)
                finally:
                    temporary_path.unlink(missing_ok=True)
            completed.append(item)
            self._write_state(completed, "in_progress")
            if interrupt_after is not None and index >= interrupt_after:
                raise LegacyMigrationError("Simulated interruption; sources preserved and restart is safe")
        self._write_state(completed, "complete")
        return self._read_state()

    def rollback(self) -> dict[str, object]:
        """Record rollback intent without deleting preserved source or copied evidence."""

        state = self._read_state()
        state["status"] = "rollback_recorded_no_deletion"
        self._atomic_write(state)
        return state

    def _write_state(self, items: list[EvidenceItem], status: str) -> None:
        state: dict[str, object] = {"status": status, "items": [asdict(item) for item in items]}
        canonical = json.dumps(state, sort_keys=True, separators=(",", ":")).encode("utf-8")
        state["manifest_sha256"] = hashlib.sha256(canonical).hexdigest()
        self._atomic_write(state)

    def _read_state(self) -> dict[str, object]:
        return json.loads(self.state_path.read_text(encoding="utf-8"))

    def _atomic_write(self, state: dict[str, object]) -> None:
        self.destination_root.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=self.destination_root, mode="w", encoding="utf-8", delete=False) as temporary:
            json.dump(state, temporary, sort_keys=True, indent=2)
            temporary.write("\n")
            temporary_path = Path(temporary.name)
        temporary_path.replace(self.state_path)
