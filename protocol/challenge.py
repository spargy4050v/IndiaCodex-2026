"""Challenge model.

A challenge is a second indexer disputing a claim. Resolving a challenge
re-runs verification: if the disputed claim is actually invalid the challenge
is UPHELD (and the original indexer is slashed, the challenger rewarded);
otherwise it is REJECTED.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from .enums import ChallengeOutcome
from .ids import new_id, utcnow


class Challenge(BaseModel):
    """A dispute raised by a challenger against an existing claim."""

    challenge_id: str = Field(default_factory=lambda: new_id("chl"))
    claim_id: str
    challenger_id: str
    reason: str = ""
    created_at: datetime = Field(default_factory=utcnow)
    resolved: bool = False
    outcome: ChallengeOutcome | None = None
    reward: float = 0.0
    resolved_at: datetime | None = None

    def resolve(self, outcome: ChallengeOutcome, reward: float = 0.0) -> "Challenge":
        """Mark the challenge resolved with the given outcome and reward."""

        self.resolved = True
        self.outcome = outcome
        self.reward = round(reward, 6)
        self.resolved_at = utcnow()
        return self
