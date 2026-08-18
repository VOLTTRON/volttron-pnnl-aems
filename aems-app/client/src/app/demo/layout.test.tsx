import { render, screen } from "@testing-library/react";
import Layout from "./layout";

describe("Demo layout", () => {
  it("renders children", () => {
    render(<Layout><span>hello world</span></Layout>);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    const { container } = render(<Layout><div /></Layout>);
    expect(container).toBeDefined();
  });
});
