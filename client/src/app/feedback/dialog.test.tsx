import { render, screen } from "@testing-library/react";

jest.mock("@apollo/client", () => ({
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
  useQuery: jest.fn(() => ({ data: undefined, loading: false })),
}));

jest.mock("../components/feedback", () => ({
  SelectFeedbackStatus: () => <div data-testid="select-status" />,
  SelectAssignee: () => <div data-testid="select-assignee" />,
  feedbackStatusList: [{ type: "open", label: "Open", icon: "inbox" }],
  unassignedUser: { id: "unassigned", name: "Unassigned", email: "" },
}));

jest.mock("../components/common/file", () => ({
  FilePreviews: () => null,
}));

describe("ViewFeedback", () => {
  it("shows placeholder when no feedback is selected", () => {
    const { ViewFeedback } = require("./dialog");
    render(<ViewFeedback open={true} setOpen={jest.fn()} feedback={undefined} />);
    expect(screen.getByText("No feedback selected")).toBeInTheDocument();
  });

  it("renders feedback content when feedback is provided", () => {
    const { ViewFeedback } = require("./dialog");
    const mockFeedback = {
      id: "f1",
      message: "This is test feedback",
      status: "open",
      assignee: null,
      user: { name: "Bob", email: "bob@example.com" },
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    render(<ViewFeedback open={true} setOpen={jest.fn()} feedback={mockFeedback} />);
    expect(screen.getByText("This is test feedback")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders Close and Update buttons", () => {
    const { ViewFeedback } = require("./dialog");
    const mockFeedback = {
      id: "f2",
      message: "Another feedback",
      status: "open",
      assignee: null,
      user: { name: "Alice", email: "alice@example.com" },
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    render(<ViewFeedback open={true} setOpen={jest.fn()} feedback={mockFeedback} />);
    expect(screen.getByText("Close")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { ViewFeedback } = require("./dialog");
    render(<ViewFeedback open={false} setOpen={jest.fn()} feedback={undefined} />);
    expect(screen.queryByText("Feedback")).not.toBeInTheDocument();
  });
});
