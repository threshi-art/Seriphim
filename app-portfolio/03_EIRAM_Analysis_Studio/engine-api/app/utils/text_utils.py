"""Text helpers for normalization and token-like processing."""

from __future__ import annotations

import re


def normalize_whitespace(text: str) -> str:
    """Collapse whitespace and trim leading/trailing spaces."""
    text = text.strip()
    return re.sub(r"\s+", " ", text)

