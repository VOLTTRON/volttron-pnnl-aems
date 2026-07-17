import { render, screen } from "@testing-library/react";
import { TextIcon } from "./texticon";

describe("TextIcon", () => {
  it("renders an SVG element", () => {
    const { container } = render(<TextIcon text="AB" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the text inside the SVG", () => {
    render(<TextIcon text="XY" />);
    expect(screen.getByText("XY")).toBeInTheDocument();
  });

  it("sets viewBox width proportional to text length", () => {
    const { container } = render(<TextIcon text="Hello" />);
    const svg = container.querySelector("svg");
    // width = max(30, 5*10+10) = 60
    expect(svg?.getAttribute("viewBox")).toBe("0 0 60 30");
  });

  it("uses minimum width of 30 for very short text", () => {
    const { container } = render(<TextIcon text="A" />);
    const svg = container.querySelector("svg");
    // width = max(30, 1*10+10) = 30
    expect(svg?.getAttribute("viewBox")).toBe("0 0 30 30");
  });

  it("applies fill color to rect when color prop is supplied", () => {
    const { container } = render(<TextIcon text="AB" color="#ff0000" />);
    const rect = container.querySelector("rect");
    expect(rect?.getAttribute("fill")).toBe("#ff0000");
  });

  it("does not apply fill attribute when color is not supplied", () => {
    const { container } = render(<TextIcon text="AB" />);
    const rect = container.querySelector("rect");
    expect(rect?.getAttribute("fill")).toBeNull();
  });
});
