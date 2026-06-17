from datetime import datetime, timedelta, time
import logging

from volttron.platform.agent.utils import (
    format_timestamp,
    get_aware_utc_now,
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
    Format a datetime for logs.

    Uses VOLTTRON's ``format_timestamp`` when possible and falls back to
    ``datetime.isoformat`` if formatting fails.

    :param value: Datetime value to format.
    :type value: datetime.datetime or None
    :returns: Formatted timestamp.
    :rtype: str
    """
    if value is None:
        return "None"

    try:
        return format_timestamp(value)
    except Exception:
        try:
            return value.isoformat()
        except Exception:
            return str(value)


def _state_name(value):
    """
    Convert a boolean service state to a readable name.

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

    The schedule may be supplied either as an already-parsed Python dictionary
    or as a YAML-compatible string.

    :param data: Schedule data.
    :type data: dict or str
    :returns: Parsed schedule dictionary.
    :rtype: dict
    :raises RuntimeError: If ``data`` is a string and PyYAML is unavailable.
    :raises TypeError: If ``data`` is not a dictionary or string.
    """
    _log.debug(
        "Loading schedule configuration. data_type=%s",
        type(data).__name__,
    )

    if isinstance(data, dict):
        _log.debug(
            "Schedule data is already a dict. days=%s",
            sorted(data.keys()),
        )
        return data

    if isinstance(data, str):
        _log.debug(
            "Schedule data is a string. yaml_available=%s",
            yaml is not None,
        )

        if yaml is None:
            _log.error(
                "Cannot parse schedule string because PyYAML is not installed."
            )
            raise RuntimeError("Install PyYAML or pass schedule_data as a dict.")

        parsed = yaml.safe_load(data)

        _log.debug(
            "Schedule string parsed successfully. parsed_type=%s days=%s",
            type(parsed).__name__,
            sorted(parsed.keys()) if isinstance(parsed, dict) else None,
        )

        return parsed

    _log.error(
        "Invalid schedule data type. expected=dict|str actual=%s",
        type(data).__name__,
    )
    raise TypeError("schedule data must be dict or string")


def parse_hhmm(value, *, is_end=False):
    """
    Convert a ``HH:MM`` time string to minutes after midnight.

    End times of ``23:59`` are treated as ``24:00``. This allows adjacent
    midnight schedules to be merged cleanly. For example, Monday
    ``22:00-23:59`` and Tuesday ``00:00-02:20`` are treated as continuous.

    :param value: Time value formatted as ``HH:MM``.
    :type value: str
    :param is_end: Whether the value is being parsed as an end time.
    :type is_end: bool
    :returns: Minutes after midnight.
    :rtype: int
    """
    _log.debug(
        "Parsing HH:MM value. value=%r is_end=%s",
        value,
        is_end,
    )

    hour, minute = map(int, value.split(":"))

    if is_end and hour == 23 and minute == 59:
        _log.debug(
            "Treating end time 23:59 as 24:00 for merge continuity."
        )
        return 24 * 60

    minutes = hour * 60 + minute

    _log.debug(
        "Parsed HH:MM value. value=%r hour=%s minute=%s minutes=%s",
        value,
        hour,
        minute,
        minutes,
    )

    return minutes


def merge_windows(windows, merge_gap=timedelta(minutes=1)):
    """
    Merge overlapping or nearly-adjacent datetime windows.

    Windows are merged when the next window starts before or within
    ``merge_gap`` of the previous window ending.

    :param windows: Iterable of ``(start_datetime, end_datetime)`` tuples.
    :type windows: list[tuple[datetime, datetime]]
    :param merge_gap: Maximum gap allowed between two windows before they are
        treated as separate windows.
    :type merge_gap: datetime.timedelta
    :returns: Merged datetime windows.
    :rtype: list[tuple[datetime, datetime]]
    """
    _log.debug(
        "Merging service windows. original_count=%s merge_gap=%s",
        len(windows) if windows else 0,
        merge_gap,
    )

    if not windows:
        _log.debug("No windows supplied. Returning empty merged window list.")
        return []

    sorted_windows = sorted(windows, key=lambda window: window[0])
    merged = [sorted_windows[0]]

    _log.debug(
        "Initial merge window. start=%s end=%s",
        _fmt_dt(sorted_windows[0][0]),
        _fmt_dt(sorted_windows[0][1]),
    )

    for start, end in sorted_windows[1:]:
        last_start, last_end = merged[-1]

        _log.debug(
            "Evaluating window for merge. candidate_start=%s "
            "candidate_end=%s last_start=%s last_end=%s",
            _fmt_dt(start),
            _fmt_dt(end),
            _fmt_dt(last_start),
            _fmt_dt(last_end),
        )

        if start <= last_end + merge_gap:
            new_end = max(last_end, end)
            merged[-1] = (last_start, new_end)

            _log.debug(
                "Merged overlapping/adjacent window. merged_start=%s "
                "old_end=%s candidate_end=%s new_end=%s",
                _fmt_dt(last_start),
                _fmt_dt(last_end),
                _fmt_dt(end),
                _fmt_dt(new_end),
            )
        else:
            merged.append((start, end))

            _log.debug(
                "Window did not overlap. Added new merged window. "
                "start=%s end=%s",
                _fmt_dt(start),
                _fmt_dt(end),
            )

    _log.debug(
        "Finished merging windows. merged_count=%s windows=%s",
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

    This scheduler evaluates a weekly schedule and calls ``start_service`` or
    ``stop_service`` whenever a transition occurs. It schedules only the next
    transition. When that transition fires, the callback applies the transition
    and then schedules the following transition, allowing the scheduler to run
    perpetually until stopped or updated.
    """

    def __init__(
        self,
        schedule_data,
        default_setpoints,
        *,
        config_get_fn,
        zone_control_fn,
        restore_setpoints_fn,
        scheduler_fn,
        merge_gap_minutes=1,
        now_func=datetime.now,
    ):
        """
        Initialize the weekly service scheduler.

        :param schedule_data: Weekly schedule configuration.
        :type schedule_data: dict or str
        :param default_setpoints: Default setpoint configuration used when
            setpoints are not found in the config store.
        :type default_setpoints: dict
        :param config_get_fn: Function used to retrieve configuration values.
        :type config_get_fn: callable
        :param zone_control_fn: Function used to write a setpoint value to a
            point. Expected signature is ``zone_control_fn(point, value)``.
        :type zone_control_fn: callable
        :param restore_setpoints_fn: Function used to restore normal setpoints
            when the service period ends.
        :type restore_setpoints_fn: callable
        :param scheduler_fn: Scheduling function. For VOLTTRON this is usually
            ``self.core.schedule`` or a wrapper around it.
        :type scheduler_fn: callable
        :param merge_gap_minutes: Maximum gap, in minutes, allowed between
            windows before they are considered separate.
        :type merge_gap_minutes: int
        :param now_func: Function returning the current datetime.
        :type now_func: callable
        """
        _log.debug(
            "Initializing WeeklyServiceScheduler. merge_gap_minutes=%s "
            "now_func=%r scheduler_fn=%r utc_now=%s",
            merge_gap_minutes,
            now_func,
            scheduler_fn,
            _fmt_dt(get_aware_utc_now()),
        )

        self.schedule_data = load_schedule(schedule_data)
        self.default_setpoints = default_setpoints

        self.config_get_fn = config_get_fn
        self.zone_control_fn = zone_control_fn
        self.restore_setpoints_fn = restore_setpoints_fn
        self.scheduler_fn = scheduler_fn

        self.merge_gap = timedelta(minutes=merge_gap_minutes)
        self.now_func = now_func

        self.service_setpoints = {}
        self._event = None
        self._last_state = None
        self.is_active = False

        _log.debug(
            "WeeklyServiceScheduler base state initialized. is_active=%s "
            "last_state=%s schedule_days=%s",
            self.is_active,
            _state_name(self._last_state),
            sorted(self.schedule_data.keys()),
        )

        self.init_service_setpoints()

        _log.debug(
            "WeeklyServiceScheduler initialization complete. "
            "service_setpoints=%s",
            self.service_setpoints,
        )

    def _get_set_points_config(self):
        """
        Get setpoint configuration from config store or defaults.

        :returns: Setpoint configuration copy.
        :rtype: dict
        """
        _log.debug("Attempting to load set_points from config store.")

        try:
            set_points = self.config_get_fn('set_points')
            source = "config_store"
        except KeyError:
            _log.debug(
                "No set_points found in config store. Falling back to "
                "default_setpoints."
            )
            set_points = self.default_setpoints
            source = "defaults"

        result = dict(set_points)

        _log.debug(
            "Loaded setpoint configuration. source=%s keys=%s values=%s",
            source,
            sorted(result.keys()),
            result,
        )

        return result

    def init_service_setpoints(self):
        """
        Initialize service heating and cooling setpoints.

        The method attempts to load setpoints from the config store using
        ``config_get_fn('set_points')``. If no config-store setpoints are
        available, ``default_setpoints`` is used.
        """
        _log.debug("Initializing service setpoints.")

        temp_set_points = self._get_set_points_config()

        if SERVICE_SET in temp_set_points:
            service_set = temp_set_points[SERVICE_SET]
            service_set_source = SERVICE_SET
        else:
            service_set = temp_set_points[OCCUPIED_SET]
            service_set_source = OCCUPIED_SET

        if SERVICE_DB in temp_set_points:
            service_db = temp_set_points[SERVICE_DB]
            service_db_source = SERVICE_DB
        else:
            service_db = temp_set_points[DB]
            service_db_source = DB

        service_set = float(service_set)
        service_db = float(service_db)

        cooling_setpoint = service_set + service_db
        heating_setpoint = service_set - service_db

        cooling_point = Points.unoccupiedcoolingsetpoint.value
        heating_point = Points.unoccupiedheatingsetpoint.value

        self.service_setpoints[cooling_point] = cooling_setpoint
        self.service_setpoints[heating_point] = heating_setpoint

        _log.debug(
            "Service setpoints initialized. service_set=%s source=%s "
            "service_db=%s source=%s cooling_point=%s cooling_setpoint=%s "
            "heating_point=%s heating_setpoint=%s",
            service_set,
            service_set_source,
            service_db,
            service_db_source,
            cooling_point,
            cooling_setpoint,
            heating_point,
            heating_setpoint,
        )

    def start_service(self):
        """
        Start service mode.

        Service mode writes the calculated service heating and cooling
        setpoints to the configured zone control points.
        """
        _log.debug(
            "Starting service mode. previous_is_active=%s setpoints=%s",
            self.is_active,
            self.service_setpoints,
        )

        self.is_active = True

        for point, setpoint in self.service_setpoints.items():
            _log.debug(
                "Writing service setpoint. point=%s setpoint=%s",
                point,
                setpoint,
            )
            self.zone_control_fn(point, setpoint)

        _log.debug("Service mode started. is_active=%s", self.is_active)

    def stop_service(self):
        """
        Stop service mode.

        Stopping service mode restores the normal configured setpoints and marks
        the scheduler state as inactive.
        """
        _log.debug(
            "Stopping service mode. previous_is_active=%s",
            self.is_active,
        )

        self.is_active = False

        set_points = self._get_set_points_config()

        _log.debug(
            "Restoring normal setpoints. set_points=%s update_store=False",
            set_points,
        )

        self.restore_setpoints_fn(
            set_points,
            update_store=False,
        )

        _log.debug("Service mode stopped. is_active=%s", self.is_active)

    def start(self, enforce_now=True):
        """
        Start the perpetual scheduling loop.

        If ``enforce_now`` is true, the current schedule state is evaluated
        immediately and either ``start_service`` or ``stop_service`` is called
        as needed. The next schedule transition is then scheduled.

        :param enforce_now: Whether to immediately enforce the current schedule
            state.
        :type enforce_now: bool
        """
        _log.debug(
            "Starting WeeklyServiceScheduler. enforce_now=%s current_time=%s "
            "last_state=%s is_active=%s",
            enforce_now,
            _fmt_dt(self.now_func()),
            _state_name(self._last_state),
            self.is_active,
        )

        if enforce_now:
            _log.debug("Enforcing current state before scheduling transition.")
            self._apply_current_state()
        else:
            _log.debug("Skipping immediate state enforcement.")

        self._schedule_next_transition()

    def stop(self):
        """
        Cancel the currently scheduled transition.

        This does not call ``stop_service``. It only cancels the pending timer,
        if one exists.
        """
        _log.debug(
            "Stopping WeeklyServiceScheduler timer. has_event=%s event=%r",
            self._event is not None,
            self._event,
        )

        if self._event is not None:
            try:
                self._event.cancel()
                _log.debug("Scheduled event cancelled successfully.")
            except Exception:
                _log.exception("Failed to cancel scheduled event.")

        self._event = None

        _log.debug("WeeklyServiceScheduler timer stopped.")

    def update_schedule(self, schedule_data, enforce_now=True):
        """
        Replace the schedule and restart the perpetual scheduler.

        Any pending scheduled transition is cancelled before the new schedule is
        loaded.

        :param schedule_data: New weekly schedule configuration.
        :type schedule_data: dict or str
        :param enforce_now: Whether to immediately enforce the new schedule's
            current state.
        :type enforce_now: bool
        """
        _log.debug(
            "Updating weekly service schedule. enforce_now=%s old_days=%s",
            enforce_now,
            sorted(self.schedule_data.keys()),
        )

        self.stop()

        self.schedule_data = load_schedule(schedule_data)
        self._last_state = None

        _log.debug(
            "New schedule loaded. new_days=%s last_state reset to %s",
            sorted(self.schedule_data.keys()),
            _state_name(self._last_state),
        )

        self.start(enforce_now=enforce_now)

    def _windows_around_now(self):
        """
        Build service windows around the current datetime.

        The method creates concrete datetime windows from seven days before now
        through fourteen days after now. This range safely captures overnight
        windows and weekly wraparound cases.

        :returns: Merged service windows around the current datetime.
        :rtype: list[tuple[datetime, datetime]]
        """
        now = self.now_func()
        today = now.date()
        start_date = today - timedelta(days=7)
        total_days = 21
        windows = []

        _log.debug(
            "Building service windows around now. now=%s today=%s "
            "start_date=%s total_days=%s tzinfo=%s",
            _fmt_dt(now),
            today,
            start_date,
            total_days,
            now.tzinfo,
        )

        for offset in range(total_days):
            day_date = start_date + timedelta(days=offset)
            day_name = DAYS[day_date.weekday()]
            day_schedule = self.schedule_data.get(day_name, {})

            day_start_dt = datetime.combine(
                day_date,
                time.min,
                tzinfo=now.tzinfo,
            )
            day_end_dt = day_start_dt + timedelta(days=1)

            _log.debug(
                "Processing schedule day. offset=%s date=%s day_name=%s "
                "day_start=%s day_end=%s day_schedule=%s",
                offset,
                day_date,
                day_name,
                _fmt_dt(day_start_dt),
                _fmt_dt(day_end_dt),
                day_schedule,
            )

            def add_full_day(section_name=None):
                windows.append((day_start_dt, day_end_dt))

                _log.debug(
                    "Added full-day service window. day=%s section=%s "
                    "start=%s end=%s",
                    day_name,
                    section_name,
                    _fmt_dt(day_start_dt),
                    _fmt_dt(day_end_dt),
                )

            def add_window(spec, section_name=None):
                _log.debug(
                    "Processing schedule section. day=%s section=%s spec=%s",
                    day_name,
                    section_name,
                    spec,
                )

                if isinstance(spec, str):
                    mode = spec.lower()

                    if mode == "always_on":
                        _log.debug(
                            "Section is always_on. Adding full day. "
                            "day=%s section=%s",
                            day_name,
                            section_name,
                        )
                        add_full_day(section_name=section_name)
                    elif mode == "always_off":
                        _log.debug(
                            "Section is always_off. No service window added. "
                            "day=%s section=%s",
                            day_name,
                            section_name,
                        )
                    else:
                        _log.error(
                            "Unknown schedule mode. day=%s section=%s mode=%r",
                            day_name,
                            section_name,
                            spec,
                        )
                        raise ValueError(f"Unknown schedule mode: {spec!r}")

                    return

                if not isinstance(spec, dict):
                    _log.error(
                        "Invalid schedule window. day=%s section=%s spec=%r "
                        "type=%s",
                        day_name,
                        section_name,
                        spec,
                        type(spec).__name__,
                    )
                    raise ValueError(f"Invalid schedule window: {spec!r}")

                start_minutes = parse_hhmm(spec["start"], is_end=False)
                end_minutes = parse_hhmm(spec["end"], is_end=True)

                start_dt = day_start_dt + timedelta(minutes=start_minutes)
                end_dt = day_start_dt + timedelta(minutes=end_minutes)

                if end_dt <= start_dt:
                    _log.debug(
                        "Detected overnight window. day=%s section=%s "
                        "start=%s original_end=%s adjusted_end=%s",
                        day_name,
                        section_name,
                        _fmt_dt(start_dt),
                        _fmt_dt(end_dt),
                        _fmt_dt(end_dt + timedelta(days=1)),
                    )
                    end_dt += timedelta(days=1)

                windows.append((start_dt, end_dt))

                _log.debug(
                    "Added service window. day=%s section=%s spec=%s "
                    "start=%s end=%s duration=%s",
                    day_name,
                    section_name,
                    spec,
                    _fmt_dt(start_dt),
                    _fmt_dt(end_dt),
                    end_dt - start_dt,
                )

            if isinstance(day_schedule, str):
                add_window(day_schedule, section_name="day")
            elif isinstance(day_schedule, dict):
                for section_name, section in day_schedule.items():
                    add_window(section, section_name=section_name)
            else:
                _log.error(
                    "Invalid day schedule. day_name=%s day_schedule=%r "
                    "type=%s",
                    day_name,
                    day_schedule,
                    type(day_schedule).__name__,
                )
                raise ValueError(
                    f"Invalid day schedule for {day_name}: {day_schedule!r}"
                )

        _log.debug(
            "Raw service windows built. raw_count=%s raw_windows=%s",
            len(windows),
            [
                {
                    "start": _fmt_dt(start),
                    "end": _fmt_dt(end),
                }
                for start, end in windows
            ],
        )

        merged = merge_windows(windows, merge_gap=self.merge_gap)

        _log.debug(
            "Service windows around now complete. merged_count=%s "
            "merged_windows=%s",
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

    def _desired_state_now(self):
        """
        Determine whether service should currently be active.

        :returns: ``True`` if the current datetime is inside a service window,
            otherwise ``False``.
        :rtype: bool
        """
        now = self.now_func()
        windows = self._windows_around_now()

        _log.debug(
            "Determining desired service state. now=%s window_count=%s",
            _fmt_dt(now),
            len(windows),
        )

        for start, end in windows:
            in_window = start <= now < end

            _log.debug(
                "Checking window against now. now=%s window_start=%s "
                "window_end=%s in_window=%s",
                _fmt_dt(now),
                _fmt_dt(start),
                _fmt_dt(end),
                in_window,
            )

            if in_window:
                _log.debug(
                    "Desired service state is ON. matched_start=%s "
                    "matched_end=%s",
                    _fmt_dt(start),
                    _fmt_dt(end),
                )
                return True

        _log.debug("Desired service state is OFF. No matching window found.")
        return False

    def _apply_current_state(self):
        """
        Apply the current desired service state.

        Calls ``start_service`` or ``stop_service`` only when the desired state
        differs from the last state applied by the scheduler.
        """
        desired_on = self._desired_state_now()

        _log.debug(
            "Applying current service state. desired_state=%s last_state=%s "
            "is_active=%s",
            _state_name(desired_on),
            _state_name(self._last_state),
            self.is_active,
        )

        if desired_on == self._last_state:
            _log.debug(
                "Desired state matches last applied state. No action taken."
            )
            return

        if desired_on:
            _log.debug("Desired state is ON. Calling start_service.")
            self.start_service()
        else:
            _log.debug("Desired state is OFF. Calling stop_service.")
            self.stop_service()

        self._last_state = desired_on

        _log.debug(
            "Current state applied. new_last_state=%s is_active=%s",
            _state_name(self._last_state),
            self.is_active,
        )

    def _next_transition(self):
        """
        Find the next service transition.

        :returns: ``None`` if there is no upcoming transition, otherwise a
            tuple of ``(transition_datetime, desired_state)``. The
            ``desired_state`` value is ``True`` for ``start_service`` and
            ``False`` for ``stop_service``.
        :rtype: tuple[datetime, bool] or None
        """
        now = self.now_func()
        windows = self._windows_around_now()

        _log.debug(
            "Finding next service transition. now=%s window_count=%s",
            _fmt_dt(now),
            len(windows),
        )

        if not windows:
            _log.debug(
                "No service windows found. No transition will be scheduled. "
                "Schedule is effectively always_off."
            )
            return None

        for start, end in windows:
            _log.debug(
                "Evaluating transition candidate. now=%s window_start=%s "
                "window_end=%s",
                _fmt_dt(now),
                _fmt_dt(start),
                _fmt_dt(end),
            )

            if now < start:
                _log.debug(
                    "Next transition found: START. run_at=%s desired_state=%s",
                    _fmt_dt(start),
                    _state_name(True),
                )
                return start, True

            if start <= now < end:
                if end - now > timedelta(days=8):
                    _log.debug(
                        "Current service window extends more than 8 days "
                        "from now. Treating as continuous always_on. "
                        "now=%s window_end=%s duration_remaining=%s",
                        _fmt_dt(now),
                        _fmt_dt(end),
                        end - now,
                    )
                    return None

                _log.debug(
                    "Next transition found: STOP. run_at=%s desired_state=%s",
                    _fmt_dt(end),
                    _state_name(False),
                )
                return end, False

        _log.debug(
            "No future transition found inside generated window range. "
            "No transition will be scheduled."
        )
        return None

    def _schedule_next_transition(self):
        """
        Schedule the next transition.

        The scheduled callback calls either ``start_service`` or
        ``stop_service`` and then schedules the following transition. This is
        what allows the scheduler to continue running perpetually.
        """
        _log.debug("Scheduling next service transition.")

        transition = self._next_transition()

        if transition is None:
            _log.debug(
                "No transition returned. Clearing scheduled event. "
                "This may mean always_off or continuous always_on."
            )
            self._event = None
            return

        run_at, desired_on = transition

        _log.debug(
            "Scheduling transition with scheduler_fn. run_at=%s "
            "desired_state=%s scheduler_fn=%r",
            _fmt_dt(run_at),
            _state_name(desired_on),
            self.scheduler_fn,
        )

        def _fire():
            _log.debug(
                "Scheduled service transition fired. run_at=%s "
                "desired_state=%s actual_now=%s previous_last_state=%s "
                "is_active=%s",
                _fmt_dt(run_at),
                _state_name(desired_on),
                _fmt_dt(self.now_func()),
                _state_name(self._last_state),
                self.is_active,
            )

            try:
                if desired_on:
                    _log.debug("Transition action is START. Calling start_service.")
                    self.start_service()
                    self._last_state = True
                else:
                    _log.debug("Transition action is STOP. Calling stop_service.")
                    self.stop_service()
                    self._last_state = False

                _log.debug(
                    "Scheduled transition action complete. new_last_state=%s "
                    "is_active=%s",
                    _state_name(self._last_state),
                    self.is_active,
                )
            except Exception:
                _log.exception(
                    "Exception while applying scheduled service transition. "
                    "desired_state=%s run_at=%s",
                    _state_name(desired_on),
                    _fmt_dt(run_at),
                )
            finally:
                _log.debug(
                    "Scheduling following transition after callback. "
                    "current_time=%s",
                    _fmt_dt(self.now_func()),
                )
                self._schedule_next_transition()

        self._event = self.scheduler_fn(run_at, _fire)

        _log.debug(
            "Transition scheduled. event=%r run_at=%s desired_state=%s",
            self._event,
            _fmt_dt(run_at),
            _state_name(desired_on),
        )