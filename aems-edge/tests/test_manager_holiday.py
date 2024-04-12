import pytest


def test_manager_holiday_none_rules():
    from manager.holiday_manager import HolidayManager

    with pytest.raises(Exception) as excinfo:
        HolidayManager(rules=None)

    assert 'Holiday Calendar holidays does not have any rules specified' == str(excinfo.value)
