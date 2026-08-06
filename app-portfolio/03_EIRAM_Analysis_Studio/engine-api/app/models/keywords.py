"""Keyword lexicons used for symbolic feature extraction.

These lexicons are Phase-1 scaffolding: transparent rule-based matches
intended to be expanded as the engine matures.
"""

from __future__ import annotations

from typing import FrozenSet


# Single-word anger markers (and close variants).
ANGER_WORDS: FrozenSet[str] = frozenset(
    {
        "angry",
        "furious",
        "rage",
        "hate",
        "hateful",
        "disgusted",
        "traitor",
        "enemy",
        "enemies",
        "corrupt",
        "outrage",
        "outraged",
    }
)

# Fear / danger / threat markers.
FEAR_WORDS: FrozenSet[str] = frozenset(
    {
        "afraid",
        "fear",
        "terrified",
        "threat",
        "danger",
        "collapse",
        "destroy",
        "ruin",
        "unsafe",
        "scared",
        "panic",
    }
)

# Grievance / betrayal markers.
GRIEVANCE_WORDS: FrozenSet[str] = frozenset(
    {
        "betrayed",
        "forgotten",
        "humiliated",
        "cheated",
        "stolen",
        "lied",
        "disrespected",
        "abandoned",
        "silenced",
        "targeted",
    }
)

# Threat / harm / coercion markers.
THREAT_WORDS: FrozenSet[str] = frozenset(
    {
        "fight",
        "war",
        "punish",
        "destroy",
        "remove",
        "attack",
        "retaliate",
        "crush",
        "eliminate",
    }
)

# Revenge markers (single tokens or short verbs).
REVENGE_WORDS: FrozenSet[str] = frozenset(
    {
        "revenge",
        "payback",
        "settle",
        "punish",
        "retaliate",
        # short phrase tokenization is handled by phrase matching elsewhere
        # but keeping this here makes it also work in single-word mode.
        "make",
        "them",
        "pay",
    }
)

# Urgency markers (phrases are handled by phrase matching).
URGENCY_WORDS: FrozenSet[str] = frozenset(
    {
        "now",
        "immediately",
        "before it is too late",
        "last chance",
        "urgent",
        "cannot wait",
        "must act",
    }
)

# Dehumanization markers.
DEHUMANIZATION_WORDS: FrozenSet[str] = frozenset(
    {
        "parasites",
        "vermin",
        "animals",
        "scum",
        "rats",
        "infestation",
    }
)

# Absolutist / certainty markers.
ABSOLUTIST_WORDS: FrozenSet[str] = frozenset(
    {
        "always",
        "never",
        "everyone",
        "nobody",
        "all",
        "nothing",
        "completely",
        "totally",
        "entirely",
    }
)

# In-group framing phrases.
INGROUP_PHRASES: FrozenSet[str] = frozenset(
    {
        "we",
        "us",
        "our people",
        "real americans",
        "patriots",
        "people like us",
    }
)

# Out-group framing phrases.
OUTGROUP_PHRASES: FrozenSet[str] = frozenset(
    {
        "they",
        "them",
        "elites",
        "traitors",
        "invaders",
        "those people",
        "the enemy",
        "parasites",
    }
)

# Victimhood narrative phrases.
VICTIMHOOD_PHRASES: FrozenSet[str] = frozenset(
    {
        "we are under attack",
        "they are coming for us",
        "nobody listens",
        "we are being replaced",
        "they hate us",
        "we are being erased",
    }
)

# Authoritarian cue phrases.
AUTHORITARIAN_PHRASES: FrozenSet[str] = frozenset(
    {
        "only one leader",
        "strong hand",
        "crush dissent",
        "take control",
        "restore order by force",
    }
)

# Escalation cue phrases.
ESCALATION_PHRASES: FrozenSet[str] = frozenset(
    {
        "fight back",
        "take back",
        "make them pay",
        "they must be stopped",
        "we cannot wait",
        "this means war",
        "do what must be done",
    }
)
