"""Limitador de intentos persistente para el login de la tesorera.

Usa PostgreSQL para guardar los intentos, lo que funciona correctamente
en entornos serverless (Vercel) donde la memoria no se comparte entre
invocaciones.

La tabla ``rate_limit_attempts`` se crea automáticamente en el startup
(via ``seed.ensure_rate_limit_table``).
"""

from __future__ import annotations

import time

from sqlalchemy import text
from sqlalchemy.orm import Session

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 60.0


def is_rate_limited(db: Session, key: str) -> bool:
    """Registra un intento para ``key`` y dice si ya superó el límite."""
    now = time.time()
    cutoff = now - WINDOW_SECONDS

    db.execute(text("DELETE FROM rate_limit_attempts WHERE attempted_at < :cutoff"), {"cutoff": cutoff})

    count = db.scalar(
        text("SELECT COUNT(*) FROM rate_limit_attempts WHERE client_key = :key AND attempted_at >= :cutoff"),
        {"key": key, "cutoff": cutoff},
    ) or 0

    if count >= MAX_ATTEMPTS:
        db.commit()
        return True

    db.execute(
        text("INSERT INTO rate_limit_attempts (client_key, attempted_at) VALUES (:key, :now)"),
        {"key": key, "now": now},
    )
    db.commit()
    return False


def reset(db: Session, key: str) -> None:
    """Limpia los intentos de ``key`` (se llama tras un login correcto)."""
    db.execute(text("DELETE FROM rate_limit_attempts WHERE client_key = :key"), {"key": key})
    db.commit()
