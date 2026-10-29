import { render } from "@testing-library/react";

const chart = {
  resize: jest.fn(),
  dispose: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  setOption: jest.fn(),
  getOption: jest.fn(() => ({})),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
};

jest.mock("echarts", () => ({
  init: jest.fn(() => chart),
  getInstanceByDom: jest.fn(() => chart),
}));

const observed: { callback: () => void; targets: Element[]; disconnect: jest.Mock }[] = [];
class FakeResizeObserver {
  entry: (typeof observed)[number];
  constructor(callback: () => void) {
    this.entry = { callback, targets: [], disconnect: jest.fn() };
    observed.push(this.entry);
  }
  observe(target: Element) {
    this.entry.targets.push(target);
  }
  disconnect() {
    this.entry.disconnect();
  }
}

describe("ECharts", () => {
  beforeEach(() => {
    observed.length = 0;
    jest.clearAllMocks();
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = FakeResizeObserver;
  });
  afterEach(() => delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver);

  it("resizes the chart when its own element changes size, with no window resize", () => {
    const { ECharts } = require("./echarts");
    const { container, unmount } = render(<ECharts option={{}} />);
    expect(observed).toHaveLength(1);
    expect(observed[0].targets).toEqual([container.firstChild]);
    expect(chart.resize).not.toHaveBeenCalled();

    observed[0].callback();
    expect(chart.resize).toHaveBeenCalledTimes(1);

    unmount();
    expect(observed[0].disconnect).toHaveBeenCalledTimes(1);
  });
});
