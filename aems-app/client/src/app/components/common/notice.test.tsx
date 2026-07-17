import { render, screen, fireEvent } from "@testing-library/react";
import { Notice } from "./notice";

describe("Notice", () => {
  it("shows the dialog on initial render", () => {
    render(<Notice />);
    expect(screen.getByText("System Use Notice")).toBeInTheDocument();
  });

  it("shows the warning text", () => {
    render(<Notice />);
    expect(screen.getByText(/FOR OFFICIAL USE ONLY/)).toBeInTheDocument();
  });

  it("hides the dialog overlay after clicking Acknowledge", () => {
    render(<Notice />);
    // The overlay is open initially
    expect(document.querySelector(".bp5-overlay-open")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /acknowledge/i }));
    // After acknowledging, the open overlay class is removed
    expect(document.querySelector(".bp5-overlay-open")).not.toBeInTheDocument();
  });
});
