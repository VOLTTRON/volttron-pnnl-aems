"use client";

import { useContext } from "react";
import { Colors } from "@blueprintjs/core";
import { compilePreferences, CurrentContext, PreferencesContext } from "../components/providers";
import { ECharts } from "../components/common/echarts";
import { range } from "lodash";

const chart = {
  active: Colors.CERULEAN2,
  black: Colors.BLACK,
  light: Colors.LIGHT_GRAY1,
  lightest: Colors.LIGHT_GRAY5,
  axis: range(0, 24).map((v) => (v < 12 ? `${v} am` : `${v - 12} pm`)),
  baseline: range(0, 24).map(() => Math.random() * 1000),
  upgraded: range(0, 24).map(() => Math.random() * 1000),
};

export function Chart() {
  const { preferences } = useContext(PreferencesContext);
  const { current } = useContext(CurrentContext);

  const { mode } = compilePreferences(preferences, current?.preferences);

  return (
    <div style={{ height: "400px" }}>
      <ECharts
        option={{
          backgroundColor: mode === "dark" ? Colors.DARK_GRAY5 : Colors.LIGHT_GRAY1,
          tooltip: {
            trigger: "axis",
          },
          dataZoom: [
            {
              type: "slider",
            },
            {
              type: "inside",
            },
          ],
          xAxis: {
            type: "category",
            data: chart.axis,
          },
          yAxis: {
            type: "value",
          },
          series: [
            {
              data: chart.baseline,
              type: "line",
              smooth: true,
              color: chart.active,
              lineStyle: {
                width: 5,
              },
              tooltip: {
                show: true,
                valueFormatter: (value) => (typeof value === "number" ? value.toFixed(2) : `${value}`),
              },
            },
            {
              data: chart.upgraded,
              type: "line",
              smooth: true,
              color: chart.black,
              lineStyle: {
                width: 5,
              },
              tooltip: {
                show: true,
                valueFormatter: (value) => (typeof value === "number" ? value.toFixed(2) : `${value}`),
              },
            },
          ],
        }}
        style={{ height: "400px" }}
        theme={mode}
      />
    </div>
  );
}
