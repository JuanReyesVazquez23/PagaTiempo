from app.rate_limit import MAX_ATTEMPTS, WINDOW_SECONDS, is_rate_limited, reset


def test_allows_up_to_max_attempts() -> None:
    key = "test-allow"
    reset(key)
    for i in range(MAX_ATTEMPTS):
        assert is_rate_limited(key, now=1000.0 + i) is False


def test_blocks_after_max_attempts() -> None:
    key = "test-block"
    reset(key)
    for i in range(MAX_ATTEMPTS):
        is_rate_limited(key, now=2000.0 + i)
    assert is_rate_limited(key, now=2000.0 + MAX_ATTEMPTS) is True


def test_window_expires() -> None:
    key = "test-window"
    reset(key)
    for i in range(MAX_ATTEMPTS):
        is_rate_limited(key, now=3000.0 + i)
    assert is_rate_limited(key, now=3000.0 + WINDOW_SECONDS + 1) is False


def test_reset_clears_state() -> None:
    key = "test-reset"
    reset(key)
    for i in range(MAX_ATTEMPTS):
        is_rate_limited(key, now=4000.0 + i)
    reset(key)
    assert is_rate_limited(key, now=4000.0) is False


def test_keys_are_independent() -> None:
    key_a, key_b = "test-a", "test-b"
    reset(key_a)
    reset(key_b)
    for i in range(MAX_ATTEMPTS):
        is_rate_limited(key_a, now=5000.0 + i)
    assert is_rate_limited(key_a, now=5000.0 + MAX_ATTEMPTS) is True
    assert is_rate_limited(key_b, now=5000.0) is False
