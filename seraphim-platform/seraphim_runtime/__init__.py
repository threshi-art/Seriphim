"""Seraphim local Runtime foundation.

This package is deliberately limited to G1-02 responsibilities: configuration,
fail-closed storage resolution, SQLite access, reporting, and evidence-preserving
legacy migration support.  It exposes no worker, executor, API, or client control.
"""

from .config import RuntimeConfig
from .storage import StorageResolutionError, resolve_database_target

__all__ = ["RuntimeConfig", "StorageResolutionError", "resolve_database_target"]
