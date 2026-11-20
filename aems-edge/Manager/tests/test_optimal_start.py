# -*- coding: utf-8 -*- {{{
# ===----------------------------------------------------------------------===
#
#                 AEMS Application — Optimal Start tests
#
# ===----------------------------------------------------------------------===
#
# Copyright 2026 Battelle Memorial Institute
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License. You may obtain a copy
# of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# ===----------------------------------------------------------------------===
# }}}
"""
Unit tests for the optimal-start models, manager and data buffer.

The synthetic data is a single morning (05:00-09:30 UTC, 1-min samples): the
supply fan starts at 06:00 and the zone moves 0.08 °F/min towards setpoint,
then the heating/cooling stage turns off. Occupancy is 08:00.
"""
import json
import os
from datetime import datetime, time, timedelta

import numpy as np
import pandas as pd
import pytest

from manager import DefaultConfig, OptimalStartConfig, Schedule
from manager.data_utils import Data, DataFileAccess, last_reading_time, to_minute_rows
from manager.optimal_start_manager import OptimalStartManager, PlatformCallbacks, resolve_model_names
from manager.optimal_start_models import (Carrier, Johnson, OperatingMode, RecoveryRegression, Sbs, Siemens,
                                         ZoneConditions)
from manager.points import DaysOfWeek, OccupancyTypes
from manager.utils import calculate_prestart_time, ema, offset_time, trim

TUESDAY = datetime(2026, 11, 3, 4, 0)


@pytest.fixture(autouse=True)
def utc_tz(monkeypatch):
    monkeypatch.setenv("LOCAL_TZ", "UTC")


def make_morning(mode="heating", start_temp=62.0, sp=70.0, oat=30.0, end="2026-11-03 09:30") -> pd.DataFrame:
    idx = pd.date_range("2026-11-03 05:00", end, freq="1min", tz="UTC")
    fan_on = idx >= pd.Timestamp("2026-11-03 06:00", tz="UTC")
    minutes_on = np.cumsum(fan_on)
    if mode == "heating":
        zone = np.minimum(start_temp + 0.08 * minutes_on, sp + 0.5)
        active = fan_on & (zone < sp)
    else:
        zone = np.maximum(start_temp - 0.08 * minutes_on, sp - 0.5)
        active = fan_on & (zone > sp)
    return pd.DataFrame(
        {
            "zonetemperature": zone,
            "coolingsetpoint": 75.0 if mode == "heating" else sp,
            "heatingsetpoint": sp if mode == "heating" else 65.0,
            "outdoortemperature": oat,
            "supplyfanstatus": fan_on.astype(int),
            "heating": (active if mode == "heating" else np.zeros(len(idx), bool)).astype(int),
            "cooling": (active if mode == "cooling" else np.zeros(len(idx), bool)).astype(int),
        },
        index=idx,
    )


MORNINGS = {
    "heating": dict(mode="heating", start_temp=62, sp=70, oat=30),
    "cooling": dict(mode="cooling", start_temp=82, sp=74, oat=90),
}

OS_CFG = OptimalStartConfig(latest_start_time=10, earliest_start_time=180, allowable_setpoint_deviation=1)


def todays_schedule():
    return Schedule(DaysOfWeek(1), datetime.now, start="08:00", end="17:00", earliest_start_time=180)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

# Baseline values recorded from the original (pre-refactor) implementation,
# after fixing the parse_df KeyError and the missing Sbs._e_last.
# Sbs differs from that baseline by design: it now trains on every minute from
# unit start to the end of the window (not just the active recovery).
GOLDEN = {
    Carrier: ({"1": 0.08}, 99.0),
    Siemens: ({"1": 0.208333333, "2": 0.0}, 99.0),
    Johnson: ({"1": 1.374752707, "2": 12.5}, 98.733288213),
    Sbs: ({}, 136.232301527),
}


@pytest.mark.parametrize("mode", ["heating", "cooling"])
@pytest.mark.parametrize("cls", list(GOLDEN))
def test_model_training_and_prediction_match_baseline(cls, mode, tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    model = cls(OS_CFG, todays_schedule)

    model.train(make_morning(**MORNINGS[mode]), 140)

    coeffs, expected_prestart = GOLDEN[cls]
    assert model.record, "training produced no record"
    assert model.is_trained
    prefix = "c" if mode == "cooling" else "h"
    for suffix, expected in coeffs.items():
        assert model.record[prefix + suffix] == pytest.approx(expected, rel=1e-6)

    before_start = make_morning(**MORNINGS[mode]).iloc[:61]
    assert model.calculate_prestart(before_start) == pytest.approx(expected_prestart, rel=1e-6)

    # Training must not leave debug files behind.
    assert list(tmp_path.iterdir()) == []


def test_sbs_learns_alpha():
    model = Sbs(OS_CFG, todays_schedule)
    model.train(make_morning(), 140)           # heating recovery
    assert len(model.alpha_list_heating) == 1 and model.alpha_list_cooling == []
    assert model.record["mode"] == "heating"
    assert model.record["new_alpha"] == pytest.approx(0.984924623, rel=1e-6)


def make_cycling_morning(on=10, off=5, rate=0.1) -> pd.DataFrame:
    """
    Cooling recovery from 80 °F to the 74 °F setpoint with the compressor (and,
    as on these RTUs, the supply fan) cycling 10 min on / 5 min off from 06:00.
    The zone only cools while the compressor runs, so the wall-clock recovery
    takes 84 min (0.0714 °F/min) even though the on-time rate is 0.1 °F/min.
    """
    idx = pd.date_range("2026-11-03 05:00", "2026-11-03 09:30", freq="1min", tz="UTC")
    zone, comp, temp = [], [], 80.0
    for minute in range(len(idx)):
        since_start = minute - 60
        running = since_start >= 0 and since_start % (on + off) < on and temp > 74.0
        temp = temp - rate if running else temp
        zone.append(round(temp, 3))
        comp.append(int(running))
    return pd.DataFrame({
        "zonetemperature": zone, "coolingsetpoint": 74.0, "heatingsetpoint": 68.0,
        "outdoortemperature": 90.0, "supplyfanstatus": comp, "cooling": comp, "heating": 0,
    }, index=idx)


@pytest.mark.parametrize("cls", [Carrier, Siemens, Johnson])
def test_timestamp_models_learn_wall_clock_recovery_with_cycling(cls):
    """These models measure elapsed time from timestamps, so off cycles are counted."""
    model = cls(OS_CFG, todays_schedule)
    model.train(make_cycling_morning(), 140)
    assert model.is_trained
    six_degrees_above = make_cycling_morning().iloc[:61]
    assert model.calculate_prestart(six_degrees_above) == pytest.approx(84, abs=5)


def test_sbs_trains_on_every_minute_including_off_cycles():
    morning = make_cycling_morning()
    model = Sbs(OS_CFG, todays_schedule)

    window = model._training_window(morning, todays_schedule(), 140)
    fan_on = window[window["supplyfanstatus"] != 0].iloc[1:]
    sbs_input = model._model_input(window, fan_on, OperatingMode.COOLING)
    # 06:00 (first fan start) through 09:00 (end of window), one row per minute.
    assert len(sbs_input) == 181
    assert sbs_input["zonetemperature"].notna().all()

    model.train(morning, 140)
    assert model.is_trained
    # Counting the off-cycle minutes gives a slower decay than the on-time-only
    # input (alpha 0.9745), i.e. a longer, wall-clock-consistent prediction.
    assert model.record["new_alpha"] == pytest.approx(0.981868, rel=1e-4)


def make_bump_morning(bump=2.5, bump_minutes=8) -> pd.DataFrame:
    """Cooling recovery 78 -> 74 F where the zone reading first rises by ``bump`` F after fan start."""
    morning = make_cycling_morning(on=1, off=0, rate=0.05)
    morning["zonetemperature"] = morning["zonetemperature"] - 2.0          # start at 78 F
    start = morning.index[60]
    rise = np.clip((morning.index - start).total_seconds() / 60 / bump_minutes, 0, 1) * bump
    after = morning.index >= start
    shifted = morning["zonetemperature"].copy()
    # rise for bump_minutes, then the original decay starting from the peak
    for i, ts in enumerate(morning.index):
        if after[i]:
            k = int((ts - start).total_seconds() // 60)
            shifted.iloc[i] = 78.0 + rise[i] if k <= bump_minutes else max(78.0 + bump - 0.05 * (k - bump_minutes), 73.9)
    morning["zonetemperature"] = shifted
    morning.loc[after, ["supplyfanstatus", "cooling"]] = 1
    return morning


def test_sbs_starts_fit_after_start_up_transient():
    morning = make_bump_morning(bump=2.5)
    model = Sbs(OS_CFG, todays_schedule)
    model.train(morning, 140)
    assert model.is_trained

    window = model._training_window(morning, todays_schedule(), 140)
    first_on = window.index[window["supplyfanstatus"] != 0][0]
    errors = model._errors(window.loc[first_on:, Sbs._SBS_COLUMNS].resample("1min").mean())
    def fit(e):
        prev = np.concatenate(([0.0], e[:-1])); return (prev * e).sum() / (prev ** 2).sum()
    peak = int(np.argmax(np.abs(errors[:20])))
    assert peak == 8                                                     # 8-minute rise after fan start
    assert model.record["new_alpha"] == pytest.approx(fit(errors[peak:]), rel=1e-9)
    assert fit(errors) > model.record["new_alpha"] + 0.002              # fitting through the rise inflates alpha


def test_sbs_does_not_train_without_a_real_recovery():
    morning = make_cycling_morning()
    morning["zonetemperature"] = 74.4          # within 1 F of the 74 F cooling SP, compressor cycling anyway
    model = Sbs(OS_CFG, todays_schedule)
    model.train(morning, 140)
    assert not model.is_trained
    assert model.record == {}


def test_sbs_keeps_separate_alpha_per_mode():
    model = Sbs(OS_CFG, todays_schedule)
    model.train(make_morning(**MORNINGS["heating"]), 140)
    cooling_now = make_morning(**MORNINGS["cooling"]).iloc[:61]
    # Trained for heating only: a cooling morning is untrained -> earliest start, not a heating alpha.
    assert model.calculate_prestart(cooling_now) == OS_CFG.earliest_start_time
    model.train(make_morning(**MORNINGS["cooling"]), 140)
    assert len(model.alpha_list_heating) == 1 and len(model.alpha_list_cooling) == 1
    assert model.calculate_prestart(cooling_now) < OS_CFG.earliest_start_time
    assert set(model.get_state()) == {"alpha_list_cooling", "alpha_list_heating"}


def test_sbs_loads_legacy_single_alpha_history_into_both_modes():
    model = Sbs(OS_CFG, todays_schedule)
    model.load_model({"alpha": 0.97, "alpha_list": [["2026-01-01", 0.97]]})
    assert model.alpha_list_cooling == [["2026-01-01", 0.97]]
    assert model.alpha_list_heating == [["2026-01-01", 0.97]]
    assert model.is_trained


def test_sbs_skips_long_data_gaps_instead_of_discarding_the_day():
    morning = make_cycling_morning()
    morning = morning.drop(morning.index[(morning.index.hour == 6) & (morning.index.minute.isin(range(20, 35)))])
    model = Sbs(OS_CFG, todays_schedule)
    model.train(morning, 140)
    assert model.is_trained
    assert np.isfinite(model.record["new_alpha"])


def test_untrained_model_returns_earliest_start():
    model = Carrier(OS_CFG, todays_schedule)
    assert model.calculate_prestart(make_morning().iloc[:61]) == OS_CFG.earliest_start_time


def _trained(cls, mode="heating"):
    model = cls(OS_CFG, todays_schedule)
    if cls is RecoveryRegression:
        for morning in _rr_mornings([61, 62, 63, 64, 65, 66], mode=mode, oat=MORNINGS[mode]["oat"]):
            model.train(morning, 140)
    else:
        model.train(make_morning(**MORNINGS[mode]), 140)
    assert model.trained_for(OperatingMode(mode))
    return model


@pytest.mark.parametrize("column", ["zonetemperature", "heatingsetpoint"])
@pytest.mark.parametrize("cls", [Carrier, Siemens, Johnson, Sbs, RecoveryRegression])
def test_missing_zone_reading_gives_earliest_start_and_is_not_ready(cls, column):
    model = _trained(cls)
    now = make_morning(start_temp=58).iloc[:61]
    assert model.ready_for(now)
    now.loc[now.index[-1], column] = np.nan
    assert model.calculate_prestart(now) == OS_CFG.earliest_start_time   # not "no recovery needed"
    assert not model.ready_for(now)


@pytest.mark.parametrize("cls", [Carrier, Siemens])
def test_outdoor_air_models_drop_out_without_outdoor_air(cls):
    model = _trained(cls)
    now = make_morning(start_temp=65).iloc[:61]
    assert np.isfinite(model.calculate_prestart(now))
    assert np.isnan(model.calculate_prestart(now.assign(outdoortemperature=np.nan)))


def test_carrier_skips_training_morning_without_outdoor_air():
    model = _trained(Carrier)
    model.train(make_morning(oat=np.nan), 140)
    assert len(model.h1) == 1 and len(model.oat_htg) == 1             # rate and OAT stay paired


def test_carrier_outdoor_air_scaling_guards():
    model = _trained(Carrier)                                         # learned at 30 F
    mild = model.calculate_prestart(make_morning(start_temp=65, oat=40).iloc[:61])
    cold = model.calculate_prestart(make_morning(start_temp=65, oat=10).iloc[:61])
    assert 0 < mild < cold
    # At or below the 0 F heating reference: slowest recovery, not a negative/infinite one.
    for oat in (0.0, -5.0):
        assert model.calculate_prestart(make_morning(start_temp=65, oat=oat).iloc[:61]) == OS_CFG.earliest_start_time
    # Learned right at the reference: the ratio cannot be formed.
    model.oat_htg = [["", 0.5]]
    assert np.isnan(model.calculate_prestart(make_morning(start_temp=65, oat=30).iloc[:61]))


def test_siemens_learns_k1_without_outdoor_air():
    model = Siemens(OS_CFG, todays_schedule)
    model.train(make_morning(oat=np.nan), 140)
    assert len(model.h1) == 1 and model.h2 == []
    assert not model.trained_for(OperatingMode.HEATING)               # k2 still needed to predict
    model.train(make_morning(), 140)
    assert len(model.h1) == 2 and len(model.h2) == 1
    assert model.trained_for(OperatingMode.HEATING)


def test_no_schedule_skips_training():
    model = Johnson(OS_CFG, lambda: None)
    model.train(make_morning(), 140)
    assert not model.is_trained


def test_state_excludes_configuration_and_round_trips():
    model = Siemens(OS_CFG, todays_schedule)
    model.train(make_morning(), 140)
    state = model.get_state()

    assert set(state) == set(Siemens.STATE_FIELDS)
    json.dumps(state)  # serializable

    restored = Siemens(OS_CFG, todays_schedule)
    restored.load_model(state)
    before_start = make_morning().iloc[:61]
    assert restored.calculate_prestart(before_start) == model.calculate_prestart(before_start)


def test_legacy_state_does_not_override_configuration():
    new_cfg = OptimalStartConfig(latest_start_time=5, earliest_start_time=120,
                                 allowable_setpoint_deviation=0.5)
    model = Carrier(new_cfg, todays_schedule)
    model.load_model({
        "c1": [["", 0.1]],
        "earliest_start_time": 999,
        "latest_start_time": 999,
        "setpoint_deviation": 9,
        "training_period_window": 99,
        "tz": "Mars/Olympus",
    })
    assert model.c1 == [["", 0.1]]
    assert model.earliest_start_time == 120
    assert model.latest_start_time == 5
    assert model.setpoint_deviation == 0.5
    assert model.tz == "UTC"


def _reference_htr(data, deviation):
    """Original loop-based heat-transfer-rate lookup, used as an oracle."""
    initial = data["tempdiff"].iloc[0]
    rows = []
    for threshold in np.linspace(0, 15, 61):
        crossed = data[(initial - data["tempdiff"]) >= threshold]
        if not crossed.empty:
            rows.append(data.loc[crossed.index[0]])
    if len(rows) == 1 and initial > deviation:
        rows.append(data.iloc[-1])
    if not rows:
        return pd.DataFrame()
    htr = pd.concat(rows, axis=1).T
    return htr[~htr.index.duplicated(keep="first")]


def test_vectorized_htr_matches_reference():
    model = Carrier(OS_CFG, todays_schedule)
    rng = np.random.default_rng(42)
    for trial in range(200):
        n = int(rng.integers(1, 120))
        idx = pd.date_range("2026-01-01", periods=n, freq="1min")
        temp_diff = np.cumsum(rng.normal(-0.1, 0.3, n)) + rng.uniform(-2, 10)
        if trial % 5 == 0:
            temp_diff[rng.integers(0, n)] = np.nan
        data = pd.DataFrame({"tempdiff": temp_diff}, index=idx)

        expected = _reference_htr(data, OS_CFG.allowable_setpoint_deviation)
        actual = model._compute_heat_transfer_rate(data)
        assert list(actual.index) == list(expected.index), f"trial {trial}"


def _rr_mornings(start_temps, mode="heating", oat=30.0):
    for t in start_temps:
        kw = dict(MORNINGS[mode]); kw["start_temp"] = t; kw["oat"] = oat
        yield make_morning(**kw)


def test_recovery_regression_records_observations():
    model = RecoveryRegression(OS_CFG, todays_schedule)
    model.train(make_morning(), 140)                       # heating 62 -> 70 F at 0.08 F/min from 06:00
    obs = model.observations_heating
    assert len(obs) == 1 and model.observations_cooling == []
    _, gap, oat_diff, minutes = obs[0]
    assert gap == pytest.approx(8.0, abs=0.1)              # 70 - 62
    assert oat_diff == pytest.approx(40.0)                 # SP - OAT for heating: 70 - 30
    assert minutes == pytest.approx(94, abs=2)             # (8 - 0.5) / 0.08 to within 0.5 F
    assert model.record["mode"] == "heating"
    json.dumps(model.get_state())


def test_recovery_regression_untrained_until_min_observations():
    model = RecoveryRegression(OS_CFG, todays_schedule)
    now = make_morning().iloc[:61]
    for i, morning in enumerate(_rr_mornings([62, 63, 64, 65])):
        model.train(morning, 140)
        assert model.calculate_prestart(now) == OS_CFG.earliest_start_time
    assert not model.trained_for(OperatingMode.HEATING)
    model.train(make_morning(start_temp=66), 140)
    assert model.trained_for(OperatingMode.HEATING) and not model.trained_for(OperatingMode.COOLING)


def test_recovery_regression_learns_gap_to_minutes():
    model = RecoveryRegression(OS_CFG, todays_schedule)
    for morning in _rr_mornings([61, 62, 63, 64, 65, 66, 67]):
        model.train(morning, 140)
    now = make_morning(start_temp=65).iloc[:61]             # gap 5 F -> (5 - 0.5) / 0.08 = 56 min
    assert model.calculate_prestart(now) == pytest.approx(56.25, abs=2.0)


def test_recovery_regression_uses_outdoor_air_and_survives_missing_oat():
    model = RecoveryRegression(OS_CFG, todays_schedule)
    # Same gap, colder outside -> slower recovery: rate 0.1 at 40 F, 0.05 at 20 F
    for oat, rate in [(40, 0.1), (35, 0.08), (30, 0.066), (25, 0.057), (20, 0.05), (40, 0.1), (30, 0.066)]:
        for gap in (4, 6):
            minutes = (gap - 0.5) / rate
            model.observations_heating.append(["", float(gap), 70.0 - oat, minutes])
    now = make_morning(start_temp=65, oat=22).iloc[:61]
    cold = model.calculate_prestart(now)
    warm = model.calculate_prestart(make_morning(start_temp=65, oat=38).iloc[:61])
    assert cold > warm
    no_oat = make_morning(start_temp=65).iloc[:61].assign(outdoortemperature=np.nan)
    assert np.isfinite(model.calculate_prestart(no_oat))     # falls back to the gap-only fit


def test_recovery_regression_weights_recent_mornings(monkeypatch):
    model = RecoveryRegression(OS_CFG, todays_schedule)
    # the zone changed 8 mornings ago: 12 older mornings recovered slowly (0.04 F/min), the 8 newest quickly (0.1)
    for i in range(20):
        rate = 0.04 if i < 12 else 0.1
        for gap in ((4.0,) if i % 2 else (6.0,)):
            model.observations_heating.append(["", gap, 40.0, (gap - 0.5) / rate])
    now = make_morning(start_temp=65).iloc[:61]                       # gap ~5 F
    recent, slow = (5 - 0.5) / 0.1, (5 - 0.5) / 0.04                  # 45 vs 112.5 min
    weighted = model.calculate_prestart(now)
    monkeypatch.setattr(RecoveryRegression, "HALF_LIFE", 0)
    equal = model.calculate_prestart(now)
    assert abs(weighted - recent) < abs(equal - recent)               # follows the recent behaviour
    assert weighted < (recent + slow) / 2 < equal                     # recent mornings decide; equal weights don't


def test_recovery_regression_without_half_life_is_the_unweighted_fit(monkeypatch):
    model = RecoveryRegression(OS_CFG, todays_schedule)
    for morning in _rr_mornings([61, 62, 63, 64, 65, 66, 67]):
        model.train(morning, 140)
    monkeypatch.setattr(RecoveryRegression, "HALF_LIFE", 0)
    now = make_morning(start_temp=65).iloc[:61]
    cond = ZoneConditions.latest(now)
    gap, oat_diff = cond.zone_error(OperatingMode.HEATING), cond.outdoor_error(OperatingMode.HEATING)
    obs = np.array([[o[1], o[2], o[3]] for o in model.observations_heating], dtype=float)
    design = np.column_stack([np.ones(len(obs)), obs[:, 0], obs[:, 0] * obs[:, 1]])
    coef, res = RecoveryRegression._huber_fit(design, obs[:, 2])
    expected = np.array([1.0, gap, gap * oat_diff]) @ coef + np.quantile(res, RecoveryRegression.MARGIN_QUANTILE)
    assert model.calculate_prestart(now) == pytest.approx(np.clip(expected, OS_CFG.latest_start_time,
                                                                  OS_CFG.earliest_start_time))


def test_weighted_quantile():
    from manager.optimal_start_models import _weighted_quantile
    values = np.array([5.0, -3.0, 10.0, 0.0, 2.0, 7.0])
    for q in (0.1, 0.5, 0.7, 0.9):
        assert _weighted_quantile(values, np.ones(6), q) == pytest.approx(np.quantile(values, q, method="hazen"))
    # nearly all the weight on one value -> the median lands on it
    w = np.array([1e-6, 1e-6, 1.0, 1e-6, 1e-6, 1e-6])
    assert _weighted_quantile(values, w, 0.5) == pytest.approx(10.0, abs=1e-3)


@pytest.mark.parametrize("earliest, latest, horizon", [(60, 0, 90), (90, 0, 90), (90, 10, 90), (120, 10, 110),
                                                      (180, 10, 170), (240, 0, 240)])
def test_observation_horizon_covers_the_full_start_allowance(earliest, latest, horizon):
    assert RecoveryRegression.observation_horizon(earliest, latest) == horizon
    cfg = OptimalStartConfig(latest_start_time=latest, earliest_start_time=earliest, allowable_setpoint_deviation=1)
    assert RecoveryRegression(cfg, todays_schedule).horizon_minutes == horizon


def test_recovery_regression_caps_unfinished_recovery_at_horizon():
    cfg = OptimalStartConfig(latest_start_time=0, earliest_start_time=90, allowable_setpoint_deviation=1)
    morning = make_morning(start_temp=50)                   # 20 F gap: not within 0.5 F by occupancy + 90 (09:30)
    model = RecoveryRegression(cfg, todays_schedule)
    model.train(morning, 140)
    assert model.observations_heating[0][3] == pytest.approx(210)   # 06:00 -> 09:30


def test_recovery_regression_observes_long_recoveries_to_the_extended_horizon():
    # earliest 180 / latest 10 -> horizon 170 min: watched to 10:50, not 09:30
    model = RecoveryRegression(OS_CFG, todays_schedule)
    model.train(make_morning(start_temp=40, end="2026-11-03 11:00"), 140)    # 30 F gap: needs ~369 min
    assert model.observations_heating[0][3] == pytest.approx(290)   # 06:00 -> 10:50, still not within 0.5 F
    finished = RecoveryRegression(OS_CFG, todays_schedule)
    finished.train(make_morning(start_temp=50, end="2026-11-03 11:00"), 140)   # 20 F gap: 19.5 / 0.08 = 244 min
    assert finished.observations_heating[0][3] == pytest.approx(244, abs=2)   # past the old 09:30 cut, recorded exactly


def test_recovery_regression_ignores_mornings_without_recovery_or_complete_data():
    model = RecoveryRegression(OS_CFG, todays_schedule)
    model.train(make_morning(start_temp=69.5), 140)          # within 1 F of SP: no recovery needed
    model.train(make_morning(start_temp=50).loc[:"2026-11-03 08:30"], 140)   # data ends before the horizon
    assert not model.is_trained and model.observations_heating == []


# ---------------------------------------------------------------------------
# Utils
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("end, minutes, expected", [
    (time(8, 0), 140, time(5, 40)),
    (time(8, 15), 15, time(8, 0)),
    (time(2, 0), 180, time(0, 0)),     # clamped instead of raising
    (time(8, 0), 7.5, time(7, 52, 30)),
])
def test_calculate_prestart_time(end, minutes, expected):
    assert calculate_prestart_time(end, minutes) == expected


@pytest.mark.parametrize("start, minutes, expected", [
    (time(8, 0), 60, time(9, 0)),
    (time(8, 45), 30, time(9, 15)),
    (time(23, 30), 60, time(23, 59)),  # clamped instead of raising
])
def test_offset_time(start, minutes, expected):
    assert offset_time(start, minutes) == expected


def test_ema_uses_standard_smoothing():
    # n = 3 -> a = 0.5: weights newest->oldest 0.5, 0.25, 0.25 (remainder on the oldest)
    assert ema([["", 10.0], ["", 20.0], ["", 40.0]]) == pytest.approx(0.25 * 10 + 0.25 * 20 + 0.5 * 40)
    assert ema([1.0, 3.0]) == pytest.approx(3.0 * 2 / 3 + 1.0 / 3)   # bare values, n = 2 -> a = 2/3
    assert ema([5.0]) == 5.0
    assert ema([]) == 0
    weights = [ema([1.0 if i == k else 0.0 for i in range(8)]) for k in range(8)]
    assert sum(weights) == pytest.approx(1.0)
    assert weights[-1] == pytest.approx(2 / 9)   # newest of 8 gets 2/(n+1)


def test_trim_normalizes_legacy_entries_and_caps_length():
    history = [0.5, ["2026-01-01", 0.6]]
    history = trim(history, 0.7, 2)
    assert [v for _, v in history] == [0.6, 0.7]
    assert trim(history, float("nan"), 2) is history


# ---------------------------------------------------------------------------
# Manager
# ---------------------------------------------------------------------------

class FakeEvent:
    def __init__(self, when, fn, args):
        self.when, self.fn, self.args = when, fn, args
        self.cancelled = False

    def cancel(self):
        self.cancelled = True


class FakePlatform:
    def __init__(self):
        self.events: list[FakeEvent] = []
        self.occupancy: list = []
        self.published: list = []
        self.store: dict = {}

    def schedule(self, when, fn, *args):
        event = FakeEvent(when, fn, args)
        self.events.append(event)
        return event

    def pending(self, fn_name):
        return [e for e in self.events if not e.cancelled and getattr(e.fn, "__name__", "") == fn_name]

    def config_get(self, key):
        return self.store[key]

    def config_set(self, key, value):
        self.store[key] = json.loads(json.dumps(value))

    def callbacks(self):
        return PlatformCallbacks(
            schedule_fn=self.schedule,
            change_occupancy_fn=self.occupancy.append,
            publish_fn=lambda topic, headers, msg: self.published.append((topic, msg)),
            config_get_fn=self.config_get,
            config_set_fn=self.config_set,
        )


class FakeHolidays:
    def __init__(self, *dates):
        self.dates = set(dates)

    def is_holiday(self, when):
        return when.date() in self.dates


class FakeData:
    def __init__(self, df=None):
        self.df = df
        self.processed = 0

    def process_data(self):
        self.processed += 1


@pytest.fixture
def platform():
    return FakePlatform()


def make_manager(tmp_path, platform, *, now=TUESDAY, schedule=None, holidays=(), df=None, models=None):
    cfg = DefaultConfig(
        system="rtu1",
        local_tz="UTC",
        data_dir=tmp_path,
        model_dir=tmp_path,
        schedule=schedule or {"Tuesday": {"start": "08:00", "end": "17:00"}},
    )
    if models is not None:
        cfg.optimal_start = OptimalStartConfig(latest_start_time=10, earliest_start_time=180,
                                               allowable_setpoint_deviation=1, models=models)
    cfg.get_current_datetime = lambda: now
    manager = OptimalStartManager(
        schedule=cfg.schedule,
        config=cfg,
        identity="test",
        holiday_manager=FakeHolidays(*holidays),
        data_handler=FakeData(df),
        callbacks=platform.callbacks(),
    )
    manager.setup_optimal_start()
    return manager


def test_default_selection_is_recovery_regression(tmp_path, platform):
    assert make_manager(tmp_path, platform).selected_models == ["rr"]
    assert OptimalStartConfig(10, 60, 1).models == ["recovery_regression"]
    assert OptimalStartConfig(10, 60, 1, models="Carrier").models == ["carrier"]


def test_resolve_model_names_accepts_names_and_tags_and_skips_unknown():
    assert resolve_model_names(["carrier", "SBS", "j", "bogus", "carrier"]) == ["c", "sbs", "j"]
    assert resolve_model_names("recovery_regression") == ["rr"]


def test_invalid_selection_falls_back_to_default(tmp_path, platform):
    assert make_manager(tmp_path, platform, models=["nope"]).selected_models == ["rr"]


def test_single_selected_model_decides(tmp_path, platform):
    manager = make_manager(tmp_path, platform, models=["carrier"])
    manager._candidates = {"c": 40.0, "j": 90.0, "s": 120.0, "rr": 70.0}
    assert manager._aggregate_start_time() == 40.0
    assert manager.result["decided_by"] == ["c"]


def test_multiple_selected_models_use_their_median(tmp_path, platform):
    manager = make_manager(tmp_path, platform, models=["carrier", "johnson", "sbs"])
    manager._candidates = {"c": 40.0, "j": 90.0, "sbs": 60.0, "s": 170.0, "rr": 20.0}
    assert manager._aggregate_start_time() == 60.0
    assert manager.result["decided_by"] == ["c", "j", "sbs"]


def test_untrained_selection_falls_back_to_all_trained_models(tmp_path, platform):
    manager = make_manager(tmp_path, platform)            # default: recovery_regression, not trained
    manager._candidates = {"c": 60.0, "j": 90.0}
    assert manager._aggregate_start_time() == 75.0
    assert manager.result["decided_by"] == ["c", "j"]
    manager._candidates = {}
    assert manager._aggregate_start_time() == manager.earliest_start_time


def test_untrained_models_are_not_candidates(tmp_path, platform):
    platform.store["optimal_start.models.c"] = {"h1": [["", 0.08]], "oat_htg": [["", 30.0]]}
    df = make_morning().iloc[:61]                          # heating needed: only Carrier is trained for it
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 4, 0), df=df, models=["carrier", "johnson"])
    manager.run_method()
    assert set(manager._candidates) == {"c"}
    assert manager.result["j"] == 180                       # untrained Johnson still published (earliest)
    assert manager.result["decided_by"] == ["c"]


def test_weekend_model_falls_back_to_weekday_version(tmp_path, platform):
    platform.store["optimal_start.models.c"] = {"h1": [["", 0.08]], "oat_htg": [["", 30.0]]}
    platform.store["optimal_start.models.j_we"] = {"c1_list": [["", 1.0]], "c2_list": [["", 5.0]]}   # weekend set trained, cooling only
    monday = datetime(2026, 11, 2, 4, 0)
    df = make_morning().iloc[:61]                          # heating needed
    manager = make_manager(tmp_path, platform, now=monday, schedule={"Monday": {"start": "08:00", "end": "17:00"}},
                           df=df, models=["carrier"])
    assert manager.weekend_holiday_trained
    manager.run_method()
    assert "c_we" in manager.result and "c" in manager.result   # weekend Carrier untrained -> weekday Carrier used
    assert manager._candidates["c"] == pytest.approx(manager.result["c"])
    assert manager.result["decided_by"] == ["c"]


def test_recovery_regression_uses_one_history_on_weekend_days(tmp_path, platform):
    monday = datetime(2026, 11, 2, 9, 35)
    platform.store["optimal_start.models.c_we"] = {"h1": [["", 0.08]]}          # make the weekend set "trained"
    manager = make_manager(tmp_path, platform, now=monday, schedule={"Monday": {"start": "08:00", "end": "17:00"}},
                           df=make_morning())
    assert manager.is_weekend_holiday()
    trained_today = manager._models_for_today()
    assert "rr" in trained_today and trained_today["rr"] is manager.models["rr"]    # weekday copy, every day
    assert "c_we" in trained_today and "c" not in trained_today                    # others keep their weekend copy
    manager.train_models()
    assert len(manager.models["rr"].observations_heating) == 1
    assert manager.weekend_holiday_models["rr_we"].observations_heating == []


def test_aggregate_ignores_non_finite_candidates(tmp_path, platform):
    manager = make_manager(tmp_path, platform, models=["carrier", "johnson"])
    platform.store.clear()
    manager._candidates = {"c": 60.0}                       # NaN/inf predictions never become candidates
    assert manager._aggregate_start_time() == 60.0


def test_weekend_models_keep_short_window_after_config_update(tmp_path, platform):
    manager = make_manager(tmp_path, platform)
    manager.update_model_configurations(
        OptimalStartConfig(latest_start_time=5, earliest_start_time=120, allowable_setpoint_deviation=1)
    )
    assert all(m.training_period_window == 4 for m in manager.weekend_holiday_models.values())
    assert all(m.training_period_window == 8 for m in manager.models.values())
    assert all(m.earliest_start_time == 120 for m in manager.weekend_holiday_models.values())


def test_weekend_trained_flag_survives_restart(tmp_path, platform):
    platform.store["optimal_start.models.c_we"] = {"c1": [["", 0.1]]}
    manager = make_manager(tmp_path, platform)
    assert manager.weekend_holiday_trained


@pytest.mark.parametrize("day_schedule, expected", [
    ("always_off", OccupancyTypes.UNOCCUPIED),
    ("always_on", OccupancyTypes.OCCUPIED),
])
def test_set_up_run_handles_always_on_off(tmp_path, platform, day_schedule, expected):
    manager = make_manager(tmp_path, platform, schedule={"Tuesday": day_schedule})
    manager.set_up_run()
    assert platform.occupancy == [expected]
    assert not platform.pending("run_method")
    assert not platform.pending("train_models")
    assert manager.data_handler.processed == 1


def test_set_up_run_on_holiday_sets_unoccupied(tmp_path, platform):
    manager = make_manager(tmp_path, platform, holidays=[TUESDAY.date()])
    manager.set_up_run()
    assert platform.occupancy == [OccupancyTypes.UNOCCUPIED]
    assert not platform.pending("train_models")


def test_set_up_run_schedules_run_and_training(tmp_path, platform):
    manager = make_manager(tmp_path, platform)
    manager.set_up_run()

    runs = platform.pending("run_method")
    assert [e.when for e in runs] == [datetime(2026, 11, 3, 5, 0)]
    trainings = platform.pending("train_models")
    # default limits 180 / 10 min: horizon 180 - 10 = 170 -> train at occupancy + 175 min
    assert [e.when for e in trainings] == [datetime(2026, 11, 3, 10, 55)]


def test_training_not_scheduled_after_window(tmp_path, platform):
    make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 11, 0))
    assert not platform.pending("train_models")


@pytest.mark.parametrize("earliest, latest, delay", [(60, 0, 95), (90, 0, 95), (120, 10, 115), (180, 10, 175)])
def test_training_waits_for_the_observation_horizon(tmp_path, platform, earliest, latest, delay):
    manager = make_manager(tmp_path, platform)
    manager.earliest_start_time, manager.latest_start_time = earliest, latest
    assert manager._training_delay_minutes() == delay


def test_run_method_without_data_commits_earliest_start(tmp_path, platform):
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 5, 0), df=None)
    manager.run_method()

    starts = [e for e in platform.events if e.args == (OccupancyTypes.OCCUPIED,)]
    assert [e.when for e in starts] == [datetime(2026, 11, 3, 5, 0)]
    assert manager.training_time == 180


def test_run_method_reschedules_when_too_early(tmp_path, platform):
    trained = {"c": {"h1": [["", 0.08]], "oat_htg": [["", 30.0]]}}
    for tag, state in trained.items():
        platform.store[f"optimal_start.models.{tag}"] = state
    df = make_morning().iloc[:61]  # zone 62 °F, setpoint 70 °F
    # Untrained models predict 180 min -> median 180 -> start 05:00, still > 15 min away at 04:00.
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 4, 0), df=df)
    manager.run_method()

    assert len(platform.pending("run_method")) == 1
    assert not [e for e in platform.events if e.args == (OccupancyTypes.OCCUPIED,)]


def _clock(manager, when):
    manager.config.get_current_datetime = lambda: when


def test_committed_start_is_not_re_decided_by_the_occupancy_sync(tmp_path, platform):
    """Regression: after a commit the sync calls run_method every minute; the decision must stay frozen."""
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 5, 0), df=None)   # untrained -> 180 min
    manager.run_method()                                                                     # commits at 05:00
    occupied = [e for e in platform.events if e.args == (OccupancyTypes.OCCUPIED,)]
    assert len(occupied) == 1 and manager.training_time == 180
    publishes = len(platform.published)
    for minute in range(1, 180):                                                             # sync until 08:00
        _clock(manager, datetime(2026, 11, 3, 5, 0) + timedelta(minutes=minute))
        manager.run_method()
    assert len([e for e in platform.events if e.args == (OccupancyTypes.OCCUPIED,)]) == 1
    assert len(platform.published) == publishes                                              # no re-publishing
    assert manager.training_time == 180                                                      # not overwritten


def test_training_window_starts_at_the_actual_start(tmp_path, platform, monkeypatch):
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 5, 0), df=None)
    manager.run_method()                                                                     # commit (lead 180)
    manager.data_handler.df = make_morning()
    start_event = next(e for e in platform.events if e.args == (OccupancyTypes.OCCUPIED,))
    _clock(manager, datetime(2026, 11, 3, 6, 0))                                             # transition fires at 06:00
    start_event.fn(*start_event.args)
    assert platform.occupancy[-1] == OccupancyTypes.OCCUPIED
    seen = []
    monkeypatch.setattr(manager, "_train_single_model", lambda tag, model, data, prestart: seen.append(prestart))
    _clock(manager, datetime(2026, 11, 3, 9, 35))
    manager.train_models()
    assert set(seen) == {120 + 5}                       # 08:00 - 06:00 = 120 min actual lead (+5 buffer), not 180


def test_training_falls_back_to_committed_lead_without_recorded_start(tmp_path, platform, monkeypatch):
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 5, 0), df=None)
    manager.run_method()
    manager.data_handler.df = make_morning()
    seen = []
    monkeypatch.setattr(manager, "_train_single_model", lambda tag, model, data, prestart: seen.append(prestart))
    _clock(manager, datetime(2026, 11, 3, 9, 35))
    manager.train_models()
    assert set(seen) == {180 + 5}


def test_reset_run_allows_a_fresh_decision(tmp_path, platform):
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 5, 0), df=None)
    manager.run_method()
    manager.reset_run()
    _clock(manager, datetime(2026, 11, 3, 5, 10))
    manager.run_method()
    assert len([e for e in platform.events if e.args == (OccupancyTypes.OCCUPIED,)]) == 2


def test_yesterdays_commitment_does_not_block_today(tmp_path, platform):
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 5, 0), df=None)
    manager.run_method()
    _clock(manager, datetime(2026, 11, 4, 5, 0))                                             # next day (Wednesday)
    manager.config.schedule["Wednesday"] = {"start": "08:00", "end": "17:00"}
    manager.run_method()
    assert len([e for e in platform.events if e.args == (OccupancyTypes.OCCUPIED,)]) == 2


def test_reset_run_cancels_pending_run(tmp_path, platform):
    manager = make_manager(tmp_path, platform)
    manager.set_up_run()
    manager.reset_run()
    assert manager.run_schedule_greenlet is None
    assert not platform.pending("run_method")


def test_train_models_persists_state_only(tmp_path, platform, monkeypatch):
    now = datetime(2026, 11, 3, 9, 5)  # Tuesday: yesterday was a weekday
    manager = make_manager(tmp_path, platform, now=now, df=make_morning())
    manager.training_time = 135
    manager.train_models()

    stored = platform.store["optimal_start.models.c"]
    assert set(stored) == set(Carrier.STATE_FIELDS)
    assert stored["h1"][0][1] == pytest.approx(0.08)
    assert (tmp_path / "rtu1_c.json").is_file()
    assert any("OptimalStartModel/c" in topic for topic, _ in platform.published)


def _overnight(end="2026-11-03 04:59", oat=95.6):
    idx = pd.date_range("2026-11-02 12:00", end, freq="1min", tz="UTC")
    return pd.DataFrame({"zonetemperature": 76.0, "coolingsetpoint": 72.0, "heatingsetpoint": 68.0,
                         "outdoortemperature": oat, "supplyfanstatus": 0, "cooling": 0, "heating": 0}, index=idx)


def test_flat_outdoor_air_is_still_used_for_prediction(tmp_path, platform):
    platform.store["optimal_start.models.c"] = {"c1": [["", 0.1]], "oat_clg": [["", 80.0]]}
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 5, 0), df=_overnight())
    manager.run_method()                                                  # OAT unchanged for 17 h: still a reading
    assert np.isfinite(manager.result["c"]) and "c" in manager.result["decided_by"]


def test_outdoor_air_topic_stopped_drops_outdoor_air_models(tmp_path, platform):
    platform.store["optimal_start.models.c"] = {"c1": [["", 0.1]], "oat_clg": [["", 80.0]]}
    df = _overnight()
    df.loc[df.index >= pd.Timestamp("2026-11-03 04:50", tz="UTC"), "outdoortemperature"] = np.nan
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 5, 0), df=df)
    manager.run_method()
    assert np.isnan(manager.result["c"]) and "c" not in manager.result["decided_by"]


def test_device_stopped_publishing_uses_earliest_start(tmp_path, platform):
    platform.store["optimal_start.models.c"] = {"c1": [["", 0.1]], "oat_clg": [["", 80.0]]}
    df = _overnight(end="2026-11-03 04:30")                               # last publish 30 min ago
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 5, 0), df=df)
    manager.run_method()
    assert manager.result["decided_by"] == []
    assert manager.training_time == manager.earliest_start_time


@pytest.mark.parametrize("last_publish, fresh", [("04:57", True), ("04:56", False)])
def test_prediction_needs_a_recent_zone_reading(tmp_path, platform, last_publish, fresh):
    df = _overnight(end=f"2026-11-03 {last_publish}")
    manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 5, 0), df=df)
    assert manager._get_prediction_data().empty is not fresh


def test_recovery_regression_history_survives_restarts(tmp_path, platform):
    """Each 'day' is a fresh manager (agent restart): restore -> train -> persist; history must accumulate."""
    for start_temp in (61, 62, 63, 64, 65, 66):
        manager = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 9, 35), df=make_morning(start_temp=start_temp))
        manager.train_models()
    stored = platform.store["optimal_start.models.rr"]
    assert set(stored) == {"observations_cooling", "observations_heating"}
    assert len(stored["observations_heating"]) == 6
    assert (tmp_path / "rtu1_rr.json").is_file()

    restarted = make_manager(tmp_path, platform, now=datetime(2026, 11, 3, 5, 0))
    rr = restarted.models["rr"]
    assert rr.trained_for(OperatingMode.HEATING)
    assert rr.observations_heating == stored["observations_heating"]
    assert rr.calculate_prestart(make_morning(start_temp=65).iloc[:61]) == pytest.approx(56.25, abs=3.0)


def test_train_models_without_data_is_noop(tmp_path, platform):
    manager = make_manager(tmp_path, platform, df=None)
    manager.train_models()
    assert not any(k.startswith("optimal_start.models") for k in platform.store)


# ---------------------------------------------------------------------------
# Data buffer
# ---------------------------------------------------------------------------

def _header(ts):
    return {"TimeStamp": ts}


@pytest.fixture
def data_handler(tmp_path):
    from dateutil import tz
    return Data(timezone=tz.gettz("UTC"), data_accessor=DataFileAccess(tmp_path / "rtu1.csv"))


def test_data_buffer_appends_and_reloads(tmp_path, data_handler):
    assert data_handler.df is None
    assert data_handler.get_current_oat() == (None, None)

    for minute in range(3):
        data_handler.update_data(
            {"ZoneTemperature": 70 + minute, "OutdoorAirTemperature": 40.0},
            _header(f"2026-11-03T06:0{minute}:00+00:00"),
        )
    # A new column forces one full rewrite; an OAT-only payload is appended.
    data_handler.update_data({"SupplyFanStatus": 1}, _header("2026-11-03T06:03:00+00:00"))
    data_handler.update_data({"OutdoorAirTemperature": 41.0}, _header("2026-11-03T06:04:00+00:00"))

    df = data_handler.df
    assert len(df) == 5
    assert list(df["zonetemperature"].iloc[:3]) == [70, 71, 72]
    assert data_handler.get_current_oat()[1] == 41.0

    reloaded = Data(timezone=data_handler.timezone, data_accessor=DataFileAccess(tmp_path / "rtu1.csv"))
    assert len(reloaded.df) == 5
    assert set(reloaded.df.columns) == {"zonetemperature", "outdoortemperature", "supplyfanstatus"}
    assert reloaded.get_current_oat()[1] == 41.0


def test_setpoint_offset_with_partial_payload(tmp_path):
    from dateutil import tz
    handler = Data(timezone=tz.gettz("UTC"), data_accessor=DataFileAccess(tmp_path / "rtu1.csv"),
                   setpoint_offset=1.0)
    handler.update_data({"OutdoorAirTemperature": 40.0}, _header("2026-11-03T06:00:00+00:00"))
    handler.update_data({"OccupiedCoolingSetPoint": 74.0, "OccupiedHeatingSetPoint": 70.0},
                        _header("2026-11-03T06:01:00+00:00"))
    last = handler.df.iloc[-1]
    assert last["coolingsetpoint"] == 75.0
    assert last["heatingsetpoint"] == 69.0


def test_process_data_rotates_file(tmp_path, data_handler):
    data_handler.update_data({"ZoneTemperature": 70}, _header("2026-11-03T06:00:00+00:00"))
    data_handler.process_data()

    assert data_handler.df is None
    assert not (tmp_path / "rtu1.csv").exists()
    rotated = [p for p in tmp_path.iterdir() if p.name.startswith("rtu1_")]
    assert len(rotated) == 1


def _publishes():
    """Device publishes on the minute, outdoor air on its own topic 20 s later."""
    rows = []
    for minute, zone in [(0, 64.0), (1, 64.5), (2, 65.0), (3, None), (4, 66.0)]:
        device = {"heatingsetpoint": 70.0}
        if zone is not None:
            device["zonetemperature"] = zone
        rows.append((pd.Timestamp(f"2026-11-03 05:0{minute}:00", tz="UTC"), device))
        rows.append((pd.Timestamp(f"2026-11-03 05:0{minute}:20", tz="UTC"),
                     {"outdoortemperature": [31.0, 31.2, 31.2, 31.5, 31.5][minute]}))
    return pd.DataFrame([r for _, r in rows], index=pd.DatetimeIndex([t for t, _ in rows], name="ts"))


def test_minute_rows_merge_device_and_outdoor_air_publishes():
    out = to_minute_rows(_publishes())
    assert len(out) == 5                                              # one row per minute, not 10
    assert list(out.index.minute) == [0, 1, 2, 3, 4]
    assert list(out["outdoortemperature"]) == [31.0, 31.2, 31.2, 31.5, 31.5]
    assert list(out["zonetemperature"]) == [64.0, 64.5, 65.0, 65.0, 66.0]   # 05:03 missed: 05:02 covers it
    assert out.notna().all().all()


def test_minute_rows_fill_at_most_two_missed_minutes():
    idx = pd.date_range("2026-11-03 05:00", periods=20, freq="1min", tz="UTC")
    df = pd.DataFrame({"zonetemperature": np.arange(20, dtype=float), "outdoortemperature": 30.0}, index=idx)
    df.loc[idx[3:5], "zonetemperature"] = np.nan                     # 2 missed minutes: filled
    df.loc[idx[8:13], "zonetemperature"] = np.nan                    # 5 missed minutes: a real gap
    df.loc[idx[15:], "outdoortemperature"] = np.nan                  # outdoor-air topic stops
    out = to_minute_rows(df)
    assert list(out.loc[idx[3:5], "zonetemperature"]) == [2.0, 2.0]
    assert idx[10] not in out.index and idx[12] not in out.index     # gap shows as missing minutes
    assert list(out.loc[idx[8:10], "zonetemperature"]) == [7.0, 7.0]
    assert out.loc[idx[15:17], "outdoortemperature"].eq(30.0).all()
    assert out.loc[idx[17:], "outdoortemperature"].isna().all()


def test_minute_rows_handle_a_dst_change_read_from_csv(tmp_path):
    from dateutil import tz
    pacific = tz.gettz("America/Los_Angeles")
    csv = tmp_path / "rtu1.csv"
    csv.write_text("ts,zonetemperature\n2026-11-01 01:59:00-07:00,70\n2026-11-01 01:00:00-08:00,71\n")
    out = to_minute_rows(DataFileAccess(csv).read(), timezone=pacific)
    assert list(out["zonetemperature"]) == [70.0, 71.0]
    assert out.index[1] - out.index[0] == pd.Timedelta(minutes=1)        # fall back: 01:59 PDT -> 01:00 PST


def test_last_reading_time_ignores_filled_values():
    df = _publishes()
    assert last_reading_time(df, "zonetemperature") == pd.Timestamp("2026-11-03 05:04", tz="UTC")
    assert last_reading_time(df, "outdoortemperature") == pd.Timestamp("2026-11-03 05:04:20", tz="UTC")
    assert last_reading_time(df, "supplyfanstatus") is None


def test_process_data_archives_one_row_per_minute(tmp_path, data_handler):
    data_handler.update_data({"ZoneTemperature": 70}, _header("2026-11-03T06:00:00+00:00"))
    data_handler.update_data({"OutdoorAirTemperature": 40.0}, _header("2026-11-03T06:00:20+00:00"))
    data_handler.update_data({"ZoneTemperature": 71}, _header("2026-11-03T06:01:00+00:00"))
    data_handler.process_data()
    rotated = next(p for p in tmp_path.iterdir() if p.name.startswith("rtu1_"))
    archived = pd.read_csv(rotated, index_col="ts")
    assert len(archived) == 2
    assert list(archived["outdoortemperature"]) == [40.0, 40.0]
