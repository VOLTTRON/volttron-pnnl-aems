import React, { useRef, useEffect } from "react";
import { init, getInstanceByDom } from "echarts";
import type { CSSProperties } from "react";
import type { EChartsOption, ECharts, SetOptionOpts } from "echarts";
import { Mode } from "@local/prisma";

const ICON_ALL =
  "path://M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M10,17L5,12L6.41,10.58L10,14.17L17.59,6.58L19,8L10,17Z";
const ICON_NONE =
  "path://M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z";
const ICON_SOME =
  "path://M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M17,13H7V11H17V13Z";

type LegendState = "all" | "none" | "some";

function getLegendNames(option: any): string[] {
  const rawLegend = option?.legend;
  const legendCfg = Array.isArray(rawLegend) ? rawLegend[0] : rawLegend;
  if (legendCfg?.data && Array.isArray(legendCfg.data)) {
    return legendCfg.data
      .map((d: any) => (typeof d === "string" ? d : d?.name))
      .filter((n: any): n is string => typeof n === "string" && n.length > 0);
  }
  const series = Array.isArray(option?.series) ? option.series : option?.series ? [option.series] : [];
  return series.map((s: any) => s?.name).filter((n: any): n is string => typeof n === "string" && n.length > 0);
}

function readLiveLegendState(chart: ECharts): { state: LegendState; names: string[] } {
  const opt: any = chart.getOption?.();
  const names = getLegendNames(opt);
  const rawLegend = opt?.legend;
  const legendCfg = Array.isArray(rawLegend) ? rawLegend[0] : rawLegend;
  const selected: Record<string, boolean> | undefined = legendCfg?.selected;
  if (!names.length || !selected) return { state: "all", names };
  let on = 0;
  let off = 0;
  for (const n of names) {
    if (selected[n] === false) off++;
    else on++;
  }
  if (off === 0) return { state: "all", names };
  if (on === 0) return { state: "none", names };
  return { state: "some", names };
}

function buildToggleFeature(state: LegendState, chartRef: React.RefObject<HTMLDivElement>) {
  const icon = state === "all" ? ICON_ALL : state === "none" ? ICON_NONE : ICON_SOME;
  const title = state === "all" ? "Hide all" : "Show all";
  return {
    show: true,
    title,
    icon,
    onclick: function () {
      const node = chartRef.current;
      if (!node) return;
      const chart = getInstanceByDom(node);
      if (!chart) return;
      const live = readLiveLegendState(chart);
      if (!live.names.length) return;
      if (live.state === "all") {
        for (const n of live.names) chart.dispatchAction({ type: "legendUnSelect", name: n });
      } else {
        chart.dispatchAction({ type: "legendAllSelect" });
      }
    },
  };
}

function buildFeatureMap(
  baseFeature: any,
  showLegendToggle: boolean | undefined,
  showDataZoomTools: boolean | undefined,
  state: LegendState,
  chartRef: React.RefObject<HTMLDivElement>,
) {
  const feature: Record<string, any> = { ...(baseFeature || {}) };
  if (showDataZoomTools) {
    feature.dataZoom = { ...(baseFeature?.dataZoom || {}) };
  }
  if (showLegendToggle) {
    feature.myToggleAll = buildToggleFeature(state, chartRef);
  }
  return feature;
}

function mergeToolbox(
  option: EChartsOption,
  state: LegendState,
  showLegendToggle: boolean | undefined,
  showDataZoomTools: boolean | undefined,
  chartRef: React.RefObject<HTMLDivElement>,
): EChartsOption {
  const existing = (option as any).toolbox;
  const base = Array.isArray(existing) ? existing[0] : existing;
  return {
    ...option,
    toolbox: {
      ...(base || {}),
      show: base?.show ?? true,
      top: base?.top ?? 0,
      right: base?.right ?? 10,
      feature: buildFeatureMap(base?.feature, showLegendToggle, showDataZoomTools, state, chartRef),
    },
  } as EChartsOption;
}

export interface ReactEChartsProps {
  option: EChartsOption;
  style?: CSSProperties;
  settings?: SetOptionOpts;
  loading?: boolean;
  theme?: "light" | "dark" | Mode;
  showLegendToggle?: boolean;
  showDataZoomTools?: boolean;
}

export function ECharts({
  option,
  style,
  settings,
  loading,
  theme,
  showLegendToggle,
  showDataZoomTools,
}: ReactEChartsProps): React.ReactNode {
  const chartRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<LegendState>("all");

  useEffect(() => {
    let chart: ECharts | undefined;
    if (chartRef.current !== null) {
      chart = init(chartRef.current, theme, { renderer: "canvas" });
    }
    function resizeChart() {
      chart?.resize();
    }
    let detachLegendListener: (() => void) | undefined;
    if (showLegendToggle && chart) {
      const handler = () => {
        const node = chartRef.current;
        if (!node) return;
        const c = getInstanceByDom(node);
        if (!c) return;
        const { state: newState } = readLiveLegendState(c);
        if (newState !== stateRef.current) {
          stateRef.current = newState;
          const currentOption: any = c.getOption?.();
          const currentToolboxRaw = currentOption?.toolbox;
          const currentToolbox = Array.isArray(currentToolboxRaw) ? currentToolboxRaw[0] : currentToolboxRaw;
          c.setOption(
            {
              toolbox: {
                ...(currentToolbox || {}),
                show: currentToolbox?.show ?? true,
                top: currentToolbox?.top ?? 0,
                right: currentToolbox?.right ?? 10,
                feature: buildFeatureMap(
                  currentToolbox?.feature,
                  showLegendToggle,
                  showDataZoomTools,
                  newState,
                  chartRef,
                ),
              },
            } as any,
            { replaceMerge: ["toolbox"], lazyUpdate: true },
          );
        }
      };
      const legendEvents = [
        "legendselectchanged",
        "legendselected",
        "legendunselected",
        "legendselectall",
        "legendinverseselect",
      ];
      for (const ev of legendEvents) chart.on(ev, handler);
      detachLegendListener = () => {
        for (const ev of legendEvents) chart?.off(ev, handler);
      };
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", resizeChart);
      return () => {
        detachLegendListener?.();
        chart?.dispose();
        window.removeEventListener("resize", resizeChart);
      };
    }
  }, [theme, showLegendToggle, showDataZoomTools]);

  useEffect(() => {
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      let finalOption = option;
      if ((showLegendToggle || showDataZoomTools) && chart) {
        const { state } = readLiveLegendState(chart);
        stateRef.current = state;
        finalOption = mergeToolbox(option, state, showLegendToggle, showDataZoomTools, chartRef);
      }
      // Use notMerge: false for better performance on updates
      // Use lazyUpdate: true to batch rendering updates
      chart!.setOption(finalOption, { notMerge: false, lazyUpdate: true, ...settings });
    }
  }, [option, settings, theme, showLegendToggle, showDataZoomTools]);

  useEffect(() => {
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      loading === true ? chart!.showLoading() : chart!.hideLoading();
    }
  }, [loading, theme]);

  return <div ref={chartRef} style={{ width: "100%", height: "100px", ...style }} />;
}
