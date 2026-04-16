import React, { useRef, useEffect } from "react";
import { init, getInstanceByDom } from "echarts";
import type { CSSProperties } from "react";
import type { EChartsOption, ECharts, SetOptionOpts } from "echarts";
import { Mode } from "@local/prisma";

export interface ReactEChartsProps {
  option: EChartsOption;
  style?: CSSProperties;
  settings?: SetOptionOpts;
  loading?: boolean;
  theme?: "light" | "dark" | Mode;
}

export function ECharts({ option, style, settings, loading, theme }: ReactEChartsProps): React.ReactNode {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart: ECharts | undefined;
    if (chartRef.current !== null) {
      chart = init(chartRef.current, theme, { renderer: "canvas" });
    }
    function resizeChart() {
      chart?.resize();
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", resizeChart);
      return () => {
        chart?.dispose();
        window.removeEventListener("resize", resizeChart);
      };
    }
  }, [theme]);

  useEffect(() => {
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      // Use notMerge: false for better performance on updates
      // Use lazyUpdate: true to batch rendering updates
      chart!.setOption(option, { notMerge: false, lazyUpdate: true, ...settings });
    }
  }, [option, settings, theme]);

  useEffect(() => {
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      loading === true ? chart!.showLoading() : chart!.hideLoading();
    }
  }, [loading, theme]);

  return <div ref={chartRef} style={{ width: "100%", height: "100px", ...style }} />;
}
