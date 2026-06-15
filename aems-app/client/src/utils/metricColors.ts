import React from "react";
import { UnitMetric, WeatherMetric, MeterMetric } from "@/graphql-codegen/graphql";
import { Palette } from "./palette";

/** Color map keyed by metric enum value */
export type MetricColorMap = Partial<Record<UnitMetric | WeatherMetric | MeterMetric, string>>;

export interface UseMetricColorsResult {
  /** Fixed colors for known metrics, keyed by UnitMetric / WeatherMetric / MeterMetric enum */
  metricColors: MetricColorMap;
  /**
   * Assign a stable, pool-sourced color to a unit/system identifier.
   * Colors are drawn from palette slots not already claimed by metric seeds, and
   * wrap predictably (round-robin) so the pool never runs dry regardless of system count.
   */
  getUnitColor: (system: string) => string;
}

/**
 * Provides a consistent, palette-driven color scheme for all dashboard metrics.
 *
 * Pre-seeded metric colors guarantee that the same metric always renders with the
 * same color across every dashboard view.  Unit/system colors are assigned from the
 * remaining (unseeded) palette slots so they never clash with metric colors.
 */
export function useMetricColors(
  primaryPalette: Palette,
  secondaryPalette: Palette,
  tertiaryPalette: Palette,
  warmPalette: Palette,
  coolPalette: Palette,
): UseMetricColorsResult {
  // Stable map: system name → assigned color (survives re-renders; reset on palette change)
  const unitColorAssignments = React.useRef(new Map<string, string>());
  const unitColorIndex = React.useRef(0);

  const metricColors = React.useMemo((): MetricColorMap => {
    return {
      // ── Temperatures ─────────────────────── primary palette ──
      [UnitMetric.ZoneTemperature]: primaryPalette.tertiary.hex,
      [UnitMetric.OutdoorAirTemperature]: primaryPalette.quinary.hex,
      [UnitMetric.ZoneHumidity]: primaryPalette.secondary.hex,

      // ── Occupied setpoints ───────────────── warm / cool palettes (solid lines) ──
      [UnitMetric.OccupiedHeatingSetPoint]: warmPalette.tertiary.hex,
      [UnitMetric.OccupiedCoolingSetPoint]: coolPalette.tertiary.hex,

      // ── Unoccupied setpoints ─────────────── warm / cool palettes (dashed lines) ──
      [UnitMetric.UnoccupiedHeatingSetPoint]: warmPalette.primary.hex,
      [UnitMetric.UnoccupiedCoolingSetPoint]: coolPalette.primary.hex,

      // ── Status signals ───────────────────── tertiary palette ──
      [UnitMetric.OccupancyCommand]: tertiaryPalette.primary.hex,
      [UnitMetric.SupplyFanStatus]: tertiaryPalette.secondary.hex,

      // ── Demand / stage ───────────────────── secondary palette ──
      [UnitMetric.FirstStageHeating]: secondaryPalette.quaternary.hex,
      // FirstStageCooling also drives the combined CoolingStage series
      [UnitMetric.FirstStageCooling]: secondaryPalette.secondary.hex,

      // ── Weather ──────────────────────────── matches OutdoorAirTemperature ──
      [WeatherMetric.AirTemperature]: primaryPalette.quinary.hex,
    };
  }, [primaryPalette, secondaryPalette, tertiaryPalette, warmPalette, coolPalette]);

  // Unit color pool: all palette slots NOT already claimed by a metric seed.
  // Collected in order across primary → secondary → tertiary, then wrapped round-robin.
  const unitColorPool = React.useMemo((): string[] => {
    const used = new Set(Object.values(metricColors));
    const pool: string[] = [];
    for (const palette of [primaryPalette, secondaryPalette, tertiaryPalette]) {
      for (let i = 0; i < palette.length; i++) {
        const hex = palette.getColor(i).hex;
        if (!used.has(hex)) pool.push(hex);
      }
    }
    return pool;
  }, [primaryPalette, secondaryPalette, tertiaryPalette, metricColors]);

  // When the user switches palette preferences the pool changes — clear stale assignments.
  React.useEffect(() => {
    unitColorAssignments.current.clear();
    unitColorIndex.current = 0;
  }, [unitColorPool]);

  const getUnitColor = React.useCallback(
    (system: string): string => {
      if (!unitColorAssignments.current.has(system)) {
        if (unitColorPool.length === 0) {
          // Degenerate fallback: all palette slots were claimed by metric seeds
          unitColorAssignments.current.set(system, primaryPalette.primary.hex);
        } else {
          unitColorAssignments.current.set(
            system,
            unitColorPool[unitColorIndex.current % unitColorPool.length],
          );
          unitColorIndex.current += 1;
        }
      }
      return unitColorAssignments.current.get(system)!;
    },
    [unitColorPool, primaryPalette],
  );

  return { metricColors, getUnitColor };
}
