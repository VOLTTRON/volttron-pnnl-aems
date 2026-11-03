import { render } from "@testing-library/react";
import { PreferencesContext } from "@/app/components/providers";
import { makeTimeAxisFormatter } from "@/app/components/common/echarts";
import { BuildingPowerChart } from "./BuildingPowerChart";

let mockOption: { xAxis: { axisLabel?: { formatter?: (value: number) => string } } };

jest.mock("echarts", () => ({}));

jest.mock("@apollo/client", () => ({
  useQuery: () => ({ data: undefined, previousData: undefined, loading: false }),
}));

jest.mock("../../components/common/echarts", () => ({
  ...jest.requireActual("../../components/common/echarts"),
  ECharts: ({ option }: { option: typeof mockOption }) => {
    mockOption = option;
    return null;
  },
}));

describe("BuildingPowerChart", () => {
  it("labels its time axis as the other dashboard charts do, in the resolved timezone", () => {
    render(
      <PreferencesContext.Provider value={{ preferences: { timezone: "Asia/Tokyo" } } as never}>
        <BuildingPowerChart
          campus="c"
          building="b"
          startTime="2026-11-02T00:00:00.000Z"
          endTime="2026-11-03T00:00:00.000Z"
          mode="light"
        />
      </PreferencesContext.Provider>,
    );

    const expected = makeTimeAxisFormatter("Asia/Tokyo");
    const midnightInTokyo = Date.parse("2026-11-02T15:00:00.000Z");
    const afternoonInTokyo = Date.parse("2026-11-03T07:00:00.000Z");
    const formatter = mockOption.xAxis.axisLabel?.formatter;
    expect(formatter?.(midnightInTokyo)).toBe(expected(midnightInTokyo));
    expect(formatter?.(afternoonInTokyo)).toBe(expected(afternoonInTokyo));
    expect(formatter?.(midnightInTokyo)).not.toBe(makeTimeAxisFormatter("UTC")(midnightInTokyo));
  });
});
