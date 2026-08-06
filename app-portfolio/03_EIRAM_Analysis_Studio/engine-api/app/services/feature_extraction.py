"""Feature extraction shared by all modules.

Phase-1 uses keyword lexicons and transparent heuristic scoring.
It supports:
- single-word matching for word-based lexicons
- substring phrase matching for phrase-based lexicons
- sentence-level evidence candidates for auditability
"""

from __future__ import annotations

import re
from collections import Counter
from typing import Any, Dict, List, Union

from app.models.keywords import (
    ABSOLUTIST_WORDS,
    ANGER_WORDS,
    AUTHORITARIAN_PHRASES,
    DEHUMANIZATION_WORDS,
    ESCALATION_PHRASES,
    FEAR_WORDS,
    GRIEVANCE_WORDS,
    INGROUP_PHRASES,
    OUTGROUP_PHRASES,
    REVENGE_WORDS,
    THREAT_WORDS,
    URGENCY_WORDS,
    VICTIMHOOD_PHRASES,
)


def _tokenize(text: str) -> List[str]:
    """Tokenize into simple word tokens for exact lexicon matching."""

    return re.findall(r"\b[\w']+\b", text.lower())


def _split_sentences(text: str) -> List[str]:
    """Very small sentence splitter suitable for heuristics."""

    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def _count_word_hits(tokens: List[str], lexicon: Union[set[str], frozenset[str]]) -> int:
    counts = Counter(tokens)
    return sum(counts[word] for word in lexicon if word in counts)


def _count_phrase_hits(text_lower: str, phrases: Union[set[str], frozenset[str]]) -> int:
    # Phrase matching is substring-based and counts each phrase at most once.
    return sum(1 for phrase in phrases if phrase in text_lower)


def _safe_ratio(value: int, total: int, scale: float = 1.0) -> float:
    """Return a 0..1 value based on value/total with clamped scaling."""

    if total <= 0:
        return 0.0
    return min(1.0, round((value / total) * scale, 4))


def extract_features(text: str) -> Dict[str, Any]:
    """Extract symbolic features for downstream module scoring."""

    text_lower = text.lower()
    tokens = _tokenize(text)
    sentences = _split_sentences(text)

    total_tokens = len(tokens)
    counts = Counter(tokens)

    anger_hits = sum(counts[w] for w in ANGER_WORDS if w in counts)
    fear_hits = sum(counts[w] for w in FEAR_WORDS if w in counts)
    grievance_hits = sum(counts[w] for w in GRIEVANCE_WORDS if w in counts)
    threat_hits = sum(counts[w] for w in THREAT_WORDS if w in counts)
    revenge_hits = sum(counts[w] for w in REVENGE_WORDS if w in counts)
    dehumanization_hits = sum(counts[w] for w in DEHUMANIZATION_WORDS if w in counts)
    absolutist_hits = sum(counts[w] for w in ABSOLUTIST_WORDS if w in counts)

    urgency_hits = _count_phrase_hits(text_lower, URGENCY_WORDS)

    ingroup_hits = _count_phrase_hits(text_lower, INGROUP_PHRASES)
    outgroup_hits = _count_phrase_hits(text_lower, OUTGROUP_PHRASES)
    victimhood_hits = _count_phrase_hits(text_lower, VICTIMHOOD_PHRASES)
    authoritarian_hits = _count_phrase_hits(text_lower, AUTHORITARIAN_PHRASES)
    escalation_phrase_hits = _count_phrase_hits(text_lower, ESCALATION_PHRASES)

    # Normalize keyword hits into 0..1 heuristic scores.
    certainty_score = _safe_ratio(absolutist_hits, max(total_tokens, 1), scale=10)
    anger_score = _safe_ratio(anger_hits, max(total_tokens, 1), scale=12)
    fear_score = _safe_ratio(fear_hits, max(total_tokens, 1), scale=12)
    grievance_score = _safe_ratio(grievance_hits, max(total_tokens, 1), scale=12)
    threat_score = _safe_ratio(threat_hits, max(total_tokens, 1), scale=12)
    revenge_score = _safe_ratio(revenge_hits, max(total_tokens, 1), scale=12)

    urgency_score = min(1.0, round(urgency_hits * 0.25, 4))
    dehumanization_score = min(1.0, round(dehumanization_hits * 0.25, 4))

    ingroup_score = min(1.0, round(ingroup_hits * 0.2, 4))
    outgroup_score = min(1.0, round(outgroup_hits * 0.2, 4))
    victimhood_score = min(1.0, round(victimhood_hits * 0.25, 4))
    authoritarian_score = min(1.0, round(authoritarian_hits * 0.3, 4))

    # Composite features.
    identity_fusion_score = min(
        1.0,
        round((ingroup_score * 0.5) + (outgroup_score * 0.3) + (victimhood_score * 0.2), 4),
    )
    moral_polarization_score = min(
        1.0,
        round((outgroup_score * 0.4) + (certainty_score * 0.3) + (grievance_score * 0.3), 4),
    )
    volatility_score = min(
        1.0,
        round((anger_score * 0.4) + (fear_score * 0.3) + (urgency_score * 0.3), 4),
    )
    humiliation_score = min(
        1.0,
        round((grievance_score * 0.6) + (victimhood_score * 0.4), 4),
    )

    # Rigidity derived from narrative entropy conceptually: higher certainty/absolutism => more rigidity.
    rigidity_score = min(
        1.0,
        round((certainty_score * 0.5) + (absolutist_hits / max(total_tokens, 1)), 4),
    )
    narrative_entropy_score = round(max(0.0, 1.0 - rigidity_score), 4)

    # Sentence level evidence candidates (audit artifacts).
    evidence_candidates: List[str] = []
    for sentence in sentences:
        s = sentence.lower()
        if any(phrase in s for phrase in ESCALATION_PHRASES):
            evidence_candidates.append(sentence)
            continue
        if any(
            word in s
            for word in ["betrayed", "fight", "enemy", "stolen", "traitor", "destroy"]
        ):
            evidence_candidates.append(sentence)

    # Keep escalation phrase bonus feature on 0..1 scale for module use.
    escalation_phrase_score = min(
        1.0,
        round(escalation_phrase_hits / max(1, len(ESCALATION_PHRASES)), 4),
    )

    return {
        # Base normalized scores (used by modules).
        "anger_score": round(anger_score, 4),
        "fear_score": round(fear_score, 4),
        "certainty_score": round(certainty_score, 4),
        "grievance_score": round(grievance_score, 4),
        "threat_score": round(threat_score, 4),
        "revenge_score": round(revenge_score, 4),
        "urgency_score": round(urgency_score, 4),
        "dehumanization_score": round(dehumanization_score, 4),
        "ingroup_score": round(ingroup_score, 4),
        "outgroup_score": round(outgroup_score, 4),
        "victimhood_score": round(victimhood_score, 4),
        "authoritarian_score": round(authoritarian_score, 4),
        "identity_fusion_score": round(identity_fusion_score, 4),
        "moral_polarization_score": round(moral_polarization_score, 4),
        "volatility_score": round(volatility_score, 4),
        "humiliation_score": round(humiliation_score, 4),
        "narrative_entropy_score": round(narrative_entropy_score, 4),
        "rigidity_score": round(rigidity_score, 4),
        # Placeholders (phase 1).
        "contradiction_score": 0.1,
        # Audit artifacts.
        "escalation_phrase_hits": escalation_phrase_hits,
        "escalation_phrase_score": escalation_phrase_score,
        "sentence_count": len(sentences),
        "token_count": total_tokens,
        "evidence_candidates": evidence_candidates[:5],
    }

