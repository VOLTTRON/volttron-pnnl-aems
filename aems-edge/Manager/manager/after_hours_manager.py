from datetime import datetime, timedelta, time
import logging

from volttron.platform.agent.utils import (
    format_timestamp,
    setup_logging,
)

from .points import Points


setup_logging()
_log = logging.getLogger(__name__)

try:
    import yaml
except ImportError:
    yaml = None


SERVICE_SET = 'ServiceSetPoint'
SERVICE_DB = 'ServiceDeadband'
OCCUPIED_SET = 'OccupiedSetPoint'
DB = 'DeadBand'

DAYS = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday",
]


def _fmt_dt(value):
    """
    Format a datetime for logging.

    :param value: Datetime value.
    :type value: datetime.datetime or None
    :returns: Formatted timestamp.
    :rtype: str
    """
    if value is None:
        return "None"

    try:
        return format_timestamp(value)
    except Exception:
        return value.isoformat() if hasattr(value, "isoformat") else str(value)


def _state_name(value):
    """
    Convert a boolean state into a readable label.

    :param value: State value.
    :type value: bool or None
    :returns: ``ON``, ``OFF``, or ``UNKNOWN``.
    :rtype: str
    """
    if value is True:
        return "ON"

    if value is False:
        return "OFF"

    return "UNKNOWN"


def load_schedule(data):
    """
    Load schedule configuration.

    :param data: Schedule data as a dict or YAML string.
    :type data: dict or str
    :returns: Parsed schedule dictionary.
    :rtype: dict
    """
    _log.debug("Loading schedule. data_type=%s", type(data).__name__)

    if isinstance(data, dict):
        _log.debug("Schedule loaded from dict. days=%s", sorted(data.keys()))
        return data

    if isinstance(data, str):
        if yaml is None:
            raise RuntimeError("Install PyYAML or pass schedule_data as a dict.")

        parsed = yaml.safe_load(data)

        _log.debug(
            "Schedule loaded from YAML. parsed_type=%s days=%s",
            type(parsed).__name__,
            sorted(parsed.keys()) if isinstance(parsed, dict) else None,
        )

        return parsed

    raise TypeError("schedule data must be dict or string")


def parse_hhmm(value, *, is_end=False):
    """
    Convert ``HH:MM`` into minutes after midnight.

    ``23:59`` end times are treated as ``24:00`` so adjacent midnight windows
    can be merged cleanly.

    :param value: Time string.
    :type value: str
    :param is_end: Whether this is an end time.
    :type is_end: bool
    :returns: Minutes after midnight.
    :rtype: int
    """
    hour, minute = map(int, value.split(":"))

    if is_end and hour == 23 and minute == 59:
        return 24 * 60

    return hour * 60 + minute


def merge_windows(windows, merge_gap=timedelta(minutes=1)):
    """
    Merge overlapping or nearly-adjacent windows.

    :param windows: ``(start, end)`` datetime tuples.
    :type windows: list[tuple[datetime, datetime]]
    :param merge_gap: Maximum gap allowed between merged windows.
    :type merge_gap: datetime.timedelta
    :returns: Merged windows.
    :rtype: list[tuple[datetime, datetime]]
    """
    if not windows:
        _log.debug("No windows to merge.")
        return []

    sorted_windows = sorted(windows, key=lambda window: window[0])
    merged = [sorted_windows[0]]

    for start, end in sorted_windows[1:]:
        last_start, last_end = merged[-1]

        if start <= last_end + merge_gap:
            merged[-1] = (last_start, max(last_end, end))
        else:
            merged.append((start, end))

    _log.debug(
        "Merged windows. input_count=%s merged_count=%s windows=%s",
        len(windows),
        len(merged),
        [
            {
                "start": _fmt_dt(start),
                "end": _fmt_dt(end),
            }
            for start, end in merged
        ],
    )

    return merged


class WeeklyServiceScheduler:
    """
    Perpetual weekly scheduler for service setpoint control.

    The scheduler evaluates the weekly schedule, starts service during active
    windows, stops service outside active windows, and schedules the next
    transition in perpetuity until stopped or updated.
    """

    def __init__(
        self,
        schedule_data,
        default_setpoints,
        config_get_fn,
        create_setpoint_fn,
        zone_control_fn,
        restore_setpoints_fn,
        scheduler_fn,
        merge_gap_minutes=1,
        now_func=datetime.now,
    ):
        """
        Initialize the scheduler.

        :param schedule_data: Weekly schedule.
        :type schedule_data: dict or str
        :param default_setpoints: Default setpoint config.
        :type default_setpoints: dict
        :param config_get_fn: Config getter.
        :type config_get_fn: callable
        :param create_setpoint_fn: Function that converts config setpoints into
            writable point/value pairs.
        :type create_setpoint_fn: callable
        :param zone_control_fn: Function used to write point values.
        :type zone_control_fn: callable
        :param restore_setpoints_fn: Function used to restore normal setpoints.
        :type restore_setpoints_fn: callable
        :param scheduler_fn: VOLTTRON schedule function or wrapper.
        :type scheduler_fn: callable
        :param merge_gap_minutes: Window merge gap in minutes.
        :type merge_gap_minutes: int
        :param now_func: Current datetime function.
        :type now_func: callable
        """
        self.schedule_data = {}
        self.default_setpoints = default_setpoints

        self.config_get_fn = config_get_fn
        self.create_setpoint_fn = create_setpoint_fn
        self.zone_control_fn = zone_control_fn
        self.restore_setpoints_fn = restore_setpoints_fn
        self.scheduler_fn = scheduler_fn

        self.merge_gap = timedelta(minutes=merge_gap_minutes)
        self.now_func = now_func

        self.service_setpoints = {}
        self._event = None
        self._last_state = False
        self.is_active = False

        _log.debug(
            "Initializing WeeklyServiceScheduler. merge_gap=%s now=%s",
            self.merge_gap,
            _fmt_dt(self.now_func()),
        )

        self.update_service_setpoints()
        self.update_schedule(schedule_data)

        _log.debug(
            "WeeklyServiceScheduler initialized. is_active=%s last_state=%s "
            "service_setpoints=%s",
            self.is_active,
            _state_name(self._last_state),
            self.service_setpoints,
        )

    def _get_set_points_config(self):
        """
        Get setpoint config from config store or defaults.

        :returns: Setpoint configuration copy.
        :rtype: dict
        """
        try:
            set_points = self.config_get_fn('set_points')
            source = "config_store"
        except KeyError:
            set_points = self.default_setpoints
            source = "defaults"

        result = dict(set_points)

        _log.debug(
            "Loaded setpoints. source=%s keys=%s",
            source,
            sorted(result.keys()),
        )

        return result

    @staticmethod
    def _pop_preferred(config, preferred_key, fallback_key):
        """
        Pop preferred key if present, otherwise return fallback value.

        This preserves the original behavior where service-specific keys are
        removed before passing the remaining config to ``create_setpoint_fn``.

        :param config: Setpoint config.
        :type config: dict
        :param preferred_key: Preferred key to pop.
        :type preferred_key: str
        :param fallback_key: Fallback key to read.
        :type fallback_key: str
        :returns: Resolved value.
        """
        if preferred_key in config:
            return config.pop(preferred_key)

        return config[fallback_key]

    def update_service_setpoints(self):
        """
        Update service mode setpoints.
        """
        temp_set_points = self._get_set_points_config()

        service_set = self._pop_preferred(
            temp_set_points,
            SERVICE_SET,
            OCCUPIED_SET,
        )
        service_db = self._pop_preferred(
            temp_set_points,
            SERVICE_DB,
            DB,
        )

        service_set = float(service_set)
        service_db = float(service_db)

        cooling_point = Points.unoccupiedcoolingsetpoint.value
        heating_point = Points.unoccupiedheatingsetpoint.value

        cooling_setpoint = service_set + service_db
        heating_setpoint = service_set - service_db

        created_setpoints = self.create_setpoint_fn(temp_set_points)

        self.service_setpoints.update(created_setpoints)
        self.service_setpoints[cooling_point] = cooling_setpoint
        self.service_setpoints[heating_point] = heating_setpoint

        _log.debug(
            "Service setpoints updated. service_set=%s service_db=%s "
            "cooling_point=%s cooling_setpoint=%s heating_point=%s "
            "heating_setpoint=%s total_points=%s",
            service_set,
            service_db,
            cooling_point,
            cooling_setpoint,
            heating_point,
            heating_setpoint,
            len(self.service_setpoints),
        )

    def start_service(self):
        """
        Start service mode.
        """
        _log.debug(
            "Starting service mode. previous_is_active=%s",
            self.is_active,
        )

        self.is_active = True
        self.update_service_setpoints()

        for point, setpoint in self.service_setpoints.items():
            _log.debug("Writing service setpoint. point=%s value=%s", point, setpoint)
            self.zone_control_fn(point, setpoint)

        _log.debug("Service mode started.")

    def stop_service(self):
        """
        Stop service mode and restore normal setpoints.
        """
        _log.debug(
            "Stopping service mode. previous_is_active=%s",
            self.is_active,
        )

        self.is_active = False
        set_points = self._get_set_points_config()

        self.restore_setpoints_fn(
            set_points,
            update_store=False,
        )

        _log.debug("Service mode stopped and setpoints restored.")

    def start(self, enforce_now=True):
        """
        Start the scheduling loop.

        :param enforce_now: Whether to immediately apply current state.
        :type enforce_now: bool
        """
        _log.debug(
            "Starting scheduler. enforce_now=%s now=%s last_state=%s",
            enforce_now,
            _fmt_dt(self.now_func()),
            _state_name(self._last_state),
        )

        if enforce_now:
            self._apply_current_state()

        self._schedule_next_transition()

    def stop(self):
        """
        Cancel the pending scheduled event.
        """
        if self._event is not None:
            try:
                _log.debug("Cancelling scheduled event. event=%r", self._event)
                self._event.cancel()
            except Exception:
                _log.exception("Failed to cancel scheduled event.")

        self._event = None

    def update_schedule(self, schedule_data, enforce_now=True):
        """
        Replace the schedule and restart scheduling.

        :param schedule_data: New schedule.
        :type schedule_data: dict or str
        :param enforce_now: Whether to immediately apply current state.
        :type enforce_now: bool
        """
        _log.debug(
            "Updating schedule. enforce_now=%s old_days=%s",
            enforce_now,
            sorted(self.schedule_data.keys()),
        )

        self.stop()
        self.schedule_data = load_schedule(schedule_data)
        self._last_state = False

        _log.debug(
            "Schedule updated. new_days=%s last_state=%s",
            sorted(self.schedule_data.keys()),
            _state_name(self._last_state),
        )

        self.start(enforce_now=enforce_now)

    def _add_schedule_window(self, windows, day_start_dt, day_end_dt, spec):
        """
        Add schedule windows for one schedule spec.

        :param windows: Window list to update.
        :type windows: list
        :param day_start_dt: Start of day.
        :type day_start_dt: datetime.datetime
        :param day_end_dt: End of day.
        :type day_end_dt: datetime.datetime
        :param spec: Schedule section spec.
        :type spec: str or dict
        """
        if isinstance(spec, str):
            mode = spec.lower()

            if mode == "always_on":
                windows.append((day_start_dt, day_end_dt))
                return

            if mode == "always_off":
                return

            raise ValueError(f"Unknown schedule mode: {spec!r}")

        if not isinstance(spec, dict):
            raise ValueError(f"Invalid schedule window: {spec!r}")

        start_minutes = parse_hhmm(spec["start"], is_end=False)
        end_minutes = parse_hhmm(spec["end"], is_end=True)

        start_dt = day_start_dt + timedelta(minutes=start_minutes)
        end_dt = day_start_dt + timedelta(minutes=end_minutes)

        if end_dt <= start_dt:
            end_dt += timedelta(days=1)

        windows.append((start_dt, end_dt))

    def _windows_around_now(self):
        """
        Build merged service windows around now.

        Builds windows from seven days before now through fourteen days after
        now to safely handle overnight and weekly wraparound cases.

        :returns: Merged service windows.
        :rtype: list[tuple[datetime, datetime]]
        """
        now = self.now_func()
        start_date = now.date() - timedelta(days=7)
        windows = []

        for offset in range(21):
            day_date = start_date + timedelta(days=offset)
            day_name = DAYS[day_date.weekday()]
            day_schedule = self.schedule_data.get(day_name, {})

            day_start_dt = datetime.combine(
                day_date,
                time.min,
                tzinfo=now.tzinfo,
            )
            day_end_dt = day_start_dt + timedelta(days=1)

            if isinstance(day_schedule, str):
                self._add_schedule_window(
                    windows,
                    day_start_dt,
                    day_end_dt,
                    day_schedule,
                )
            elif isinstance(day_schedule, dict):
                for section in day_schedule.values():
                    self._add_schedule_window(
                        windows,
                        day_start_dt,
                        day_end_dt,
                        section,
                    )
            else:
                raise ValueError(
                    f"Invalid day schedule for {day_name}: {day_schedule!r}"
                )

        merged = merge_windows(windows, merge_gap=self.merge_gap)

        _log.debug(
            "Built service windows. now=%s raw_count=%s merged_count=%s",
            _fmt_dt(now),
            len(windows),
            len(merged),
        )

        return merged

    def _desired_state_now(self):
        """
        Determine whether service should currently be active.

        :returns: ``True`` if now is inside a service window.
        :rtype: bool
        """
        now = self.now_func()
        windows = self._windows_around_now()

        desired_on = any(start <= now < end for start, end in windows)

        _log.debug(
            "Desired state evaluated. now=%s desired_state=%s",
            _fmt_dt(now),
            _state_name(desired_on),
        )

        return desired_on

    def _apply_current_state(self):
        """
        Apply current desired service state.
        """
        desired_on = self._desired_state_now()

        _log.debug(
            "Applying state. desired=%s last=%s active=%s",
            _state_name(desired_on),
            _state_name(self._last_state),
            self.is_active,
        )

        if desired_on == self._last_state:
            _log.debug("Desired state already applied. No action taken.")
            return

        if desired_on:
            self.start_service()
        else:
            self.stop_service()

        self._last_state = desired_on

    def _next_transition(self):
        """
        Find the next transition.

        :returns: ``None`` or ``(transition_datetime, desired_state)``.
        :rtype: tuple[datetime, bool] or None
        """
        now = self.now_func()
        windows = self._windows_around_now()

        if not windows:
            _log.debug("No service windows found. No transition scheduled.")
            return None

        for start, end in windows:
            if now < start:
                _log.debug("Next transition START at %s", _fmt_dt(start))
                return start, True

            if start <= now < end:
                if end - now > timedelta(days=8):
                    _log.debug(
                        "Current window extends beyond 8 days. Treating as "
                        "continuous always_on."
                    )
                    return None

                _log.debug("Next transition STOP at %s", _fmt_dt(end))
                return end, False

        _log.debug("No future transition found.")
        return None

    def _schedule_next_transition(self):
        """
        Schedule the next transition.
        """
        transition = self._next_transition()

        if transition is None:
            self._event = None
            return

        run_at, desired_on = transition

        _log.debug(
            "Scheduling transition. run_at=%s desired_state=%s",
            _fmt_dt(run_at),
            _state_name(desired_on),
        )

        def _fire():
            _log.debug(
                "Transition fired. run_at=%s desired_state=%s actual_now=%s",
                _fmt_dt(run_at),
                _state_name(desired_on),
                _fmt_dt(self.now_func()),
            )

            try:
                if desired_on:
                    self.start_service()
                    self._last_state = True
                else:
                    self.stop_service()
                    self._last_state = False

                _log.debug(
                    "Transition complete. last_state=%s active=%s",
                    _state_name(self._last_state),
                    self.is_active,
                )
            except Exception:
                _log.exception(
                    "Exception while applying transition. run_at=%s "
                    "desired_state=%s",
                    _fmt_dt(run_at),
                    _state_name(desired_on),
                )
            finally:
                self._schedule_next_transition()

        self._event = self.scheduler_fn(run_at, _fire)

        _log.debug(
            "Transition scheduled. event=%r run_at=%s desired_state=%s",
            self._event,
            _fmt_dt(run_at),
            _state_name(desired_on),
        )