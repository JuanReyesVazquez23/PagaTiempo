from unittest.mock import MagicMock, call

from app.rate_limit import MAX_ATTEMPTS, WINDOW_SECONDS, is_rate_limited, reset


def _mock_db():
    db = MagicMock()
    db.scalar.return_value = 0
    return db


def test_allows_up_to_max_attempts() -> None:
    key = "test-allow"
    db = _mock_db()
    reset(db, key)
    for i in range(MAX_ATTEMPTS):
        db.scalar.return_value = i
        assert is_rate_limited(db, key) is False


def test_blocks_after_max_attempts() -> None:
    key = "test-block"
    db = _mock_db()
    reset(db, key)
    for i in range(MAX_ATTEMPTS):
        db.scalar.return_value = i
        is_rate_limited(db, key)
    db.scalar.return_value = MAX_ATTEMPTS
    assert is_rate_limited(db, key) is True


def test_window_expires() -> None:
    key = "test-window"
    db = _mock_db()
    reset(db, key)
    for i in range(MAX_ATTEMPTS):
        db.scalar.return_value = i
        is_rate_limited(db, key)
    db.scalar.return_value = 0
    assert is_rate_limited(db, key) is False


def test_reset_clears_state() -> None:
    key = "test-reset"
    db = _mock_db()
    reset(db, key)
    for i in range(MAX_ATTEMPTS):
        db.scalar.return_value = i
        is_rate_limited(db, key)
    reset(db, key)
    db.scalar.return_value = 0
    assert is_rate_limited(db, key) is False


def test_keys_are_independent() -> None:
    key_a, key_b = "test-a", "test-b"
    db = _mock_db()
    reset(db, key_a)
    reset(db, key_b)
    for i in range(MAX_ATTEMPTS):
        db.scalar.return_value = i
        is_rate_limited(db, key_a)
    db.scalar.return_value = MAX_ATTEMPTS
    assert is_rate_limited(db, key_a) is True
    db.scalar.return_value = 0
    assert is_rate_limited(db, key_b) is False
