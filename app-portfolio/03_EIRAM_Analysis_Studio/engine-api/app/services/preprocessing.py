"""Text preprocessing for EiRAM."""

from __future__ import annotations

from app.utils.text_utils import normalize_whitespace


def preprocess_text(text: str) -> str:
    """Normalize raw input text for downstream feature extraction."""
    normalized = normalize_whitespace(text)
    return normalized
