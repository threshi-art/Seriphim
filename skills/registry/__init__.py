from .contracts import (
    RegistryValidationError,
    canonical_json,
    content_digest,
    validate_governance_ledger,
    validate_manifest,
)
from .resolver import resolve_registry, serializable_snapshot

__all__ = [
    "RegistryValidationError",
    "build_public_projection",
    "canonical_json",
    "compare_snapshots",
    "content_digest",
    "resolve_registry",
    "serializable_snapshot",
    "validate_governance_ledger",
    "validate_manifest",
]


def __getattr__(name: str):
    """Load projection helpers lazily so ``python -m`` remains warning-free."""
    if name in {"build_public_projection", "compare_snapshots"}:
        from . import projection

        return getattr(projection, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
