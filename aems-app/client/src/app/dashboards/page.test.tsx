import { render, screen } from "@testing-library/react";
import { CurrentContext } from "../components/providers";

const units = [
  { id: "u1", campus: "PNNL", building: "ROB", system: "RTU01", label: "RTU 1" },
  { id: "u2", campus: "PNNL", building: "ROB", system: "RTU02", label: "RTU 2" },
];

jest.mock("@apollo/client", () => ({
  useQuery: jest.fn(() => ({ data: { readUnits: units }, loading: false })),
}));

const links: { href: string; prefetch?: boolean | null }[] = [];
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, prefetch, children }: { href: string; prefetch?: boolean | null; children: React.ReactNode }) => {
    links.push({ href, prefetch });
    return <a href={href}>{children}</a>;
  },
}));

describe("Dashboards page", () => {
  beforeEach(() => (links.length = 0));

  it("opens every dashboard without prefetching it", () => {
    const Page = require("./page").default;
    render(
      <CurrentContext.Provider value={{ current: { role: "user" } } as never}>
        <Page />
      </CurrentContext.Provider>,
    );
    expect(screen.getByText("Site Overview")).toBeInTheDocument();
    expect(links.map((l) => l.href)).toEqual([
      "/dashboards/pnnl/rob/site",
      "/dashboards/pnnl/rob/rtu01",
      "/dashboards/pnnl/rob/rtu02",
    ]);
    expect(links.every((l) => l.prefetch === false)).toBe(true);
  });
});
