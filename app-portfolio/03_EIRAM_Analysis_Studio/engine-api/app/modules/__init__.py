"""EiRAM modular analytics modules.

Each module exposes an `analyze(features: dict) -> dict` function.
"""

from . import ddm, ecs, eem, iri, pfm, tdm, vdm

__all__ = ["ddm", "ecs", "eem", "iri", "pfm", "tdm", "vdm"]
