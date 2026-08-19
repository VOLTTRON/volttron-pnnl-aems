import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("About page", () => {
  it("renders the page heading", () => {
    render(<Page />);
    expect(screen.getByText("About This Application")).toBeInTheDocument();
  });

  it("renders the technology stack section", () => {
    render(<Page />);
    expect(screen.getByText("Technology Stack")).toBeInTheDocument();
  });

  it("mentions Next.js in the tech stack", () => {
    render(<Page />);
    expect(screen.getByText(/Next\.js/)).toBeInTheDocument();
  });

  it("renders the Project Structure section", () => {
    render(<Page />);
    expect(screen.getByText("Project Structure")).toBeInTheDocument();
  });

  it("renders the Development section", () => {
    render(<Page />);
    expect(screen.getByText("Development")).toBeInTheDocument();
  });
});
