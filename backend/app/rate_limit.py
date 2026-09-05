"""Limitador de intentos en memoria para el login de la tesorera.

El PIN es corto (4+ dígitos) y se compara con secrets.compare_digest,
pero sin un límite de intentos alguien podría probar miles de PIN por
minuto. Esto acota los intentos por IP con una ventana deslizante.

No es distribuido: sirve para una sola instancia del backend (un
servicio de Railway). Si en el futuro corres varias instancias detrás
de un balanceador, esto habría que moverlo a un store compartido
(p. ej. Redis) para que el límite aplique entre todas.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 60.0

_attempts: dict[str, deque[float]] = defaultdict(deque)
_lock = Lock()


def _prune(bucket: deque[float], now: float) -> None:
    while bucket and now - bucket[0] > WINDOW_SECONDS:
        bucket.popleft()


def is_rate_limited(key: str, now: float | None = None) -> bool:
    """Registra un intento para `key` y dice si ya superó el límite.

    `now` solo existe para poder probar la función de forma
    determinista; en uso real siempre se toma el reloj actual.
    """
    current = time.monotonic() if now is None else now
    with _lock:
        bucket = _attempts[key]
        _prune(bucket, current)
        if len(bucket) >= MAX_ATTEMPTS:
            return True
        bucket.append(current)
        return False


def reset(key: str) -> None:
    """Limpia los intentos de `key` (se llama tras un login correcto)."""
    with _lock:
        _attempts.pop(key, None)
