import { render, screen } from "@testing-library/react";
import { LoadingContext } from "../components/providers";

jest.mock("@apollo/client", () => ({
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
}));

jest.mock("@blueprintjs/datetime2", () => ({
  DateInput3: () => <input data-testid="date-input" />,
  TimePrecision: { MINUTE: "minute" },
}));

const mockLoadingCtx = {
  loadings: [],
  createLoading: jest.fn(() => ({ id: "test-loading", timestamp: 0, type: 1 })),
  clearLoading: jest.fn(),
};

function withLoading(node: React.ReactNode) {
  return <LoadingContext.Provider value={mockLoadingCtx}>{node}</LoadingContext.Provider>;
}

describe("CreateBanner", () => {
  it("renders the Create Banner dialog with form fields", () => {
    const { CreateBanner } = require("./dialog");
    render(withLoading(<CreateBanner open={true} setOpen={jest.fn()} />));
    expect(screen.getByText("Create Banner")).toBeInTheDocument();
    expect(screen.getByText("Message")).toBeInTheDocument();
    expect(screen.getByTestId("date-input")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { CreateBanner } = require("./dialog");
    render(withLoading(<CreateBanner open={false} setOpen={jest.fn()} />));
    expect(screen.queryByText("Create Banner")).not.toBeInTheDocument();
  });
});

describe("UpdateBanner", () => {
  const mockBanner = {
    id: "b1",
    message: "Test message",
    expiration: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("renders the Update Banner dialog with existing data", () => {
    const { UpdateBanner } = require("./dialog");
    render(withLoading(<UpdateBanner open={true} setOpen={jest.fn()} banner={mockBanner} />));
    expect(screen.getByText("Update Banner")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test message")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("renders with no banner data", () => {
    const { UpdateBanner } = require("./dialog");
    render(withLoading(<UpdateBanner open={true} setOpen={jest.fn()} />));
    expect(screen.getByText("Update Banner")).toBeInTheDocument();
  });
});

describe("DeleteBanner", () => {
  const mockBanner = {
    id: "b1",
    message: "Banner to delete",
    expiration: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("renders the Delete Banner dialog with confirmation text", () => {
    const { DeleteBanner } = require("./dialog");
    render(withLoading(<DeleteBanner open={true} setOpen={jest.fn()} banner={mockBanner} />));
    expect(screen.getByText("Delete Banner")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to delete the banner?")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });
});
