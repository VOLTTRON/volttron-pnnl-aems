import { render, screen } from "@testing-library/react";
import { LoadingContext } from "./components/providers";

const mockLoadingCtx = {
  loadings: [],
  createLoading: jest.fn(() => ({ id: "test-loading", timestamp: 0, type: 1 })),
  clearLoading: jest.fn(),
};

function withLoading(node: React.ReactNode) {
  return <LoadingContext.Provider value={mockLoadingCtx}>{node}</LoadingContext.Provider>;
}

describe("CreateDialog", () => {
  it("renders title and Create button", () => {
    const { CreateDialog } = require("./dialog");
    render(
      withLoading(
        <CreateDialog open={true} setOpen={jest.fn()} title="Create Something" onCreate={() => Promise.resolve()}>
          <span>content</span>
        </CreateDialog>,
      ),
    );
    expect(screen.getByText("Create Something")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { CreateDialog } = require("./dialog");
    render(
      withLoading(
        <CreateDialog open={false} setOpen={jest.fn()} title="Hidden" onCreate={() => Promise.resolve()} />,
      ),
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});

describe("ReadDialog", () => {
  it("renders title and Close button", () => {
    const { ReadDialog } = require("./dialog");
    render(
      withLoading(
        <ReadDialog open={true} setOpen={jest.fn()} title="View Something">
          <span>details</span>
        </ReadDialog>,
      ),
    );
    expect(screen.getByText("View Something")).toBeInTheDocument();
    expect(screen.getByText("Close")).toBeInTheDocument();
  });
});

describe("UpdateDialog", () => {
  it("renders title and Update button", () => {
    const { UpdateDialog } = require("./dialog");
    render(
      withLoading(
        <UpdateDialog open={true} setOpen={jest.fn()} title="Update Something" onUpdate={() => Promise.resolve()} />,
      ),
    );
    expect(screen.getByText("Update Something")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });
});

describe("DeleteDialog", () => {
  it("renders title and Delete button", () => {
    const { DeleteDialog } = require("./dialog");
    render(
      withLoading(
        <DeleteDialog open={true} setOpen={jest.fn()} title="Delete Something" onDelete={() => Promise.resolve()}>
          <p>Are you sure?</p>
        </DeleteDialog>,
      ),
    );
    expect(screen.getByText("Delete Something")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it("renders title and Confirm button", () => {
    const { ConfirmDialog } = require("./dialog");
    render(
      withLoading(
        <ConfirmDialog open={true} setOpen={jest.fn()} title="Confirm Action" onConfirm={() => Promise.resolve()}>
          <p>Confirm this?</p>
        </ConfirmDialog>,
      ),
    );
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Confirm this?")).toBeInTheDocument();
  });
});

describe("ViewDialog", () => {
  it("renders title and Close button", () => {
    const { ViewDialog } = require("./dialog");
    render(
      withLoading(
        <ViewDialog open={true} setOpen={jest.fn()} title="View Details">
          <span>view content</span>
        </ViewDialog>,
      ),
    );
    expect(screen.getByText("View Details")).toBeInTheDocument();
    expect(screen.getByText("Close")).toBeInTheDocument();
    expect(screen.getByText("view content")).toBeInTheDocument();
  });
});
