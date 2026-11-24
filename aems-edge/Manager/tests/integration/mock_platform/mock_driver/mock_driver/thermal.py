"""
Simple single-zone RTU simulation used by the mock platform driver.

The zone temperature drifts toward outdoor air through the envelope and is
driven by one cooling and one heating stage under a thermostat with
hysteresis. The thermostat follows the *active* setpoints: occupied setpoints
when the occupancy command is "occupied", unoccupied setpoints otherwise.
The supply fan runs with the stage (auto fan).

Kept dependency-free (standard library only) so it runs inside the agent and
in the offline seeding script with identical behaviour.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

OCCUPIED, UNOCCUPIED = 2, 3


@dataclass
class ZoneParams:
    """
    Physical parameters of one simulated zone.

    :ivar envelope_tau_min: Time constant of the drift toward outdoor air (minutes).
    :ivar cooling_rate: Cooling capacity at the reference outdoor air (°F/min).
    :ivar heating_rate: Heating capacity (°F/min).
    :ivar capacity_oat_ref: Outdoor air (°F) at which ``cooling_rate`` applies.
    :ivar capacity_oat_slope: Fraction of cooling capacity lost per °F above the reference.
    :ivar hysteresis: Thermostat stage on/off band around the active setpoint (°F).
    :ivar start_bump: Temporary rise of the zone reading after fan start (°F); 0 = none.
    :ivar start_bump_minutes: Duration of that rise (minutes).
    """
    envelope_tau_min: float = 480.0
    cooling_rate: float = 0.12
    heating_rate: float = 0.10
    capacity_oat_ref: float = 75.0
    capacity_oat_slope: float = 0.01
    hysteresis: float = 0.5
    start_bump: float = 0.0
    start_bump_minutes: float = 6.0


@dataclass
class ZoneState:
    """Mutable state of one simulated zone (point name -> value is built by :meth:`points`)."""
    zone_temperature: float = 76.0
    occupancy: int = UNOCCUPIED
    occupied_cooling_sp: float = 72.5
    occupied_heating_sp: float = 69.5
    unoccupied_cooling_sp: float = 76.0
    unoccupied_heating_sp: float = 65.0
    occupied_sp: float = 71.0
    deadband: float = 3.0
    cooling: int = 0
    heating: int = 0
    fan: int = 0
    minutes_since_fan_start: float = 1e9
    extra: dict = field(default_factory=dict)       # any other point written by the manager

    def active_setpoints(self) -> tuple[float, float]:
        if self.occupancy == OCCUPIED:
            return self.occupied_cooling_sp, self.occupied_heating_sp
        return self.unoccupied_cooling_sp, self.unoccupied_heating_sp


def outdoor_air(minute_of_day: float, low: float = 74.0, high: float = 90.0) -> float:
    """Diurnal outdoor-air curve: minimum near 06:00, maximum near 15:00 (°F)."""
    phase = (minute_of_day - 6 * 60) / (18 * 60) * math.pi       # 06:00 -> 0, 24:00 -> pi
    return low + (high - low) * max(0.0, math.sin(min(phase, math.pi)))


def step(state: ZoneState, params: ZoneParams, oat: float, dt_min: float) -> None:
    """Advance the zone by ``dt_min`` minutes (call with small steps, e.g. 1/6 min)."""
    csp, hsp = state.active_setpoints()
    reading = state.zone_temperature
    if state.cooling:
        if reading < csp - params.hysteresis:
            state.cooling = 0
    elif reading > csp + params.hysteresis:
        state.cooling = 1
    if state.heating:
        if reading > hsp + params.hysteresis:
            state.heating = 0
    elif reading < hsp - params.hysteresis:
        state.heating = 1
    if state.cooling and state.heating:
        state.heating = 0

    fan = 1 if (state.cooling or state.heating) else 0
    if fan and not state.fan:
        state.minutes_since_fan_start = 0.0
    state.fan = fan
    state.minutes_since_fan_start += dt_min

    capacity = params.cooling_rate * max(0.3, 1.0 - params.capacity_oat_slope * (oat - params.capacity_oat_ref))
    drive = (oat - state.zone_temperature) / params.envelope_tau_min
    drive -= capacity if state.cooling else 0.0
    drive += params.heating_rate if state.heating else 0.0
    state.zone_temperature += drive * dt_min


def reading(state: ZoneState, params: ZoneParams) -> float:
    """Zone temperature as the sensor reports it (adds the optional start-up bump)."""
    if params.start_bump and state.minutes_since_fan_start < params.start_bump_minutes:
        frac = state.minutes_since_fan_start / params.start_bump_minutes
        return state.zone_temperature + params.start_bump * math.sin(frac * math.pi)
    return state.zone_temperature


def recovery_minutes(start_temp: float, oat: float, params: ZoneParams, cooling_sp: float = 72.5,
                     heating_sp: float = 69.5, target: float = 0.5, dt_min: float = 1 / 6,
                     limit_min: float = 240.0) -> float:
    """
    Minutes from switching to occupied until the zone is within ``target`` of the
    occupied cooling setpoint (cooling) - the quantity RecoveryRegression learns.
    """
    st = ZoneState(zone_temperature=start_temp, occupancy=OCCUPIED,
                   occupied_cooling_sp=cooling_sp, occupied_heating_sp=heating_sp)
    t = 0.0
    while t < limit_min:
        step(st, params, oat, dt_min)
        t += dt_min
        if reading(st, params) <= cooling_sp + target:
            return round(t, 1)
    return limit_min
