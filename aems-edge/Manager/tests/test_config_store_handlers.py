"""Config-store entries the Manager reacts to (main_manager.config_store_handlers)."""

from manager.main_manager import SET_POINTS_ENTRY, config_store_handlers


class FakeProxy:
    def __init__(self):
        self.calls = []

    def __getattr__(self, name):
        if not name.startswith("set_"):
            raise AttributeError(name)

        def record(contents, update_store=True):
            self.calls.append((name, contents, update_store))
            return True
        record.__name__ = name
        return record


SETPOINTS = {"UnoccupiedHeatingSetPoint": 60.0, "UnoccupiedCoolingSetPoint": 85.0, "DeadBand": 3, "OccupiedSetPoint": 71}


def test_the_stored_set_points_entry_is_applied_when_it_changes():
    # The manager stores, validates and restores setpoints under SET_POINTS_ENTRY,
    # so storing that entry must apply them right away (not at the next validation).
    proxy = FakeProxy()
    handlers = config_store_handlers(proxy)
    assert SET_POINTS_ENTRY == "set_points"
    handlers[SET_POINTS_ENTRY](SETPOINTS, update_store=False)
    assert proxy.calls == [("set_temperature_setpoints", SETPOINTS, False)]


def test_only_set_points_holds_the_setpoints():
    # One entry per setting: with a second setpoints entry, startup callbacks
    # (delivered in no guaranteed order) could apply - and store - either one.
    handlers = config_store_handlers(FakeProxy())
    assert [name for name in handlers if "point" in name] == [SET_POINTS_ENTRY]
    assert "temperature_setpoints" not in handlers


def test_every_entry_has_a_handler():
    names = set(config_store_handlers(FakeProxy()))
    assert names == {"schedule", "set_points", "holidays", "optimal_start", "occupancy_overrides",
                     "location", "control"}
