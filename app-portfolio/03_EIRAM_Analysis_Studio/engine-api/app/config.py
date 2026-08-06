"""Configuration for the EiRAM service."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Runtime settings.

    Phase-1 keeps configuration minimal and rule-based.
    """

    module_version: str = "0.1.0"


SETTINGS = Settings()

