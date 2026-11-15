"""A small in-memory rate limiter, per client key. One process only; enough for one container.

It protects the free model quota: OpenRouter allows 20 requests a minute and 50 or 1,000 a day
on free models (https://openrouter.ai/docs/api/reference/limits, read 2026-11-15).
"""

import threading
import time
from collections import defaultdict, deque


class RateLimiter:
    def __init__(self, per_minute: int, per_day: int, clock=time.monotonic) -> None:
        self._limits = ((60.0, per_minute), (86_400.0, per_day))
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()
        self._clock = clock

    def check(self, key: str) -> float | None:
        """Records a hit and returns None, or returns the seconds to wait when over a limit."""
        now = self._clock()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] >= 86_400.0:
                hits.popleft()
            for window, limit in self._limits:
                recent = [h for h in hits if now - h < window]
                if len(recent) >= limit:
                    return max(1.0, window - (now - recent[0]))
            hits.append(now)
            if len(self._hits) > 10_000:
                for stale in [k for k, v in self._hits.items() if not v]:
                    del self._hits[stale]
            return None
