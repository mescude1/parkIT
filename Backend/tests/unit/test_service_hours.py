"""Unit tests for the service-hours window helper (epic #31).

``_within_service_hours`` accepts an explicit ``now`` so the time logic
can be tested deterministically without mocking the clock.
"""

from datetime import datetime

from app.blueprint.valet import (
    _within_service_hours,
    SERVICE_HOUR_START,
    SERVICE_HOUR_END,
)


# Happy path -----------------------------------------------------------------

def test_within_service_hours_returns_true_inside_window(app):
    """Any hour inside [06:00, 22:00) is considered open."""
    midday = datetime(2026, 5, 1, 12, 0, 0)
    assert _within_service_hours(midday) is True

    # Exactly at opening time.
    opening = datetime(2026, 5, 1, SERVICE_HOUR_START, 0, 0)
    assert _within_service_hours(opening) is True


# Alternative flow -----------------------------------------------------------

def test_within_service_hours_returns_false_outside_window(app):
    """Hours before opening or at/after closing are considered closed."""
    early = datetime(2026, 5, 1, 5, 59, 0)
    assert _within_service_hours(early) is False

    # Closing time is exclusive — 22:00 itself is already closed.
    closing = datetime(2026, 5, 1, SERVICE_HOUR_END, 0, 0)
    assert _within_service_hours(closing) is False

    late = datetime(2026, 5, 1, 23, 30, 0)
    assert _within_service_hours(late) is False
