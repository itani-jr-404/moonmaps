"""A small thread-safe LRU cache for computed results."""

from collections import OrderedDict
from collections.abc import Callable, Hashable
from threading import Lock


class LruCache[K: Hashable, V]:
    def __init__(self, max_entries: int) -> None:
        self._max = max_entries
        self._items: OrderedDict[K, V] = OrderedDict()
        self._lock = Lock()

    def get_or_set(self, key: K, build: Callable[[], V]) -> V:
        with self._lock:
            if key in self._items:
                self._items.move_to_end(key)
                return self._items[key]
        value = build()
        with self._lock:
            self._items[key] = value
            self._items.move_to_end(key)
            while len(self._items) > self._max:
                self._items.popitem(last=False)
        return value

    def __len__(self) -> int:
        return len(self._items)
