import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { CreateFeedbackDocument, ReadUsersDocument } from "@/graphql-codegen/graphql";
import { FeedbackWidget, FeedbackForm, SelectFeedbackStatus, feedbackStatusList, unassignedUser } from "./feedback";
import { CurrentContext } from "../providers/current";
import { NotificationContext, NotificationProvider, NotificationType } from "../providers/notification";

jest.mock("html2canvas", () => jest.fn().mockResolvedValue({ toBlob: jest.fn() }));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

const mockCurrentUser = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  image: null,
  role: "user",
  emailVerified: null,
  preferences: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const readUsersMock = {
  request: {
    query: ReadUsersDocument,
    variables: { where: { role: { equals: "admin" } } },
  },
  result: { data: { readUsers: [], countUsers: 0 } },
};

const createFeedbackSuccess = {
  request: {
    query: CreateFeedbackDocument,
    variables: { create: { message: "Test feedback", files: { connect: undefined } } },
  },
  result: { data: { createFeedback: { message: "Test feedback", files: [] } } },
};

const createFeedbackError = {
  request: {
    query: CreateFeedbackDocument,
    variables: { create: { message: "Bad message", files: { connect: undefined } } },
  },
  error: new Error("submission failed"),
};

function renderFeedbackWidget({ current = mockCurrentUser as any } = {}) {
  return render(
    <MockedProvider mocks={[readUsersMock]} addTypename={false}>
      <CurrentContext.Provider value={{ current, loading: false, updateCurrent: jest.fn(), refetchCurrent: jest.fn() }}>
        <NotificationProvider>
          <FeedbackWidget />
        </NotificationProvider>
      </CurrentContext.Provider>
    </MockedProvider>,
  );
}

function renderFeedbackForm(mocks: any[], onClose = jest.fn()) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <NotificationProvider>
        <FeedbackForm onClose={onClose} />
      </NotificationProvider>
    </MockedProvider>,
  );
}

describe("feedbackStatusList", () => {
  it("is a non-empty array of status items", () => {
    expect(Array.isArray(feedbackStatusList)).toBe(true);
    expect(feedbackStatusList.length).toBeGreaterThan(0);
  });

  it("each item has a label and type", () => {
    for (const item of feedbackStatusList) {
      expect(typeof item.label).toBe("string");
      expect(typeof item.type).toBe("string");
    }
  });
});

describe("unassignedUser", () => {
  it("has id 'unassigned' and name 'Unassigned'", () => {
    expect(unassignedUser.id).toBe("unassigned");
    expect(unassignedUser.name).toBe("Unassigned");
  });
});

describe("FeedbackWidget", () => {
  it("shows Send feedback button for users", () => {
    renderFeedbackWidget();
    expect(screen.getByRole("button", { name: /send feedback/i })).toBeInTheDocument();
  });

  it("does not show widget for non-users (null current)", () => {
    renderFeedbackWidget({ current: null });
    expect(screen.queryByRole("button", { name: /send feedback/i })).not.toBeInTheDocument();
  });

  it("opens feedback form when Send feedback is clicked", () => {
    renderFeedbackWidget();
    fireEvent.click(screen.getByRole("button", { name: /send feedback/i }));
    expect(screen.getByRole("form", { name: /feedback form/i })).toBeInTheDocument();
  });

  it("closes feedback form when toggled again", () => {
    renderFeedbackWidget();
    const btn = screen.getByRole("button", { name: /send feedback/i });
    fireEvent.click(btn);
    expect(screen.getByRole("form", { name: /feedback form/i })).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByRole("form", { name: /feedback form/i })).not.toBeInTheDocument();
  });

  it("hides widget when dismiss button is clicked", () => {
    renderFeedbackWidget();
    // The X button dismisses the widget container (uses IconNames.CROSS)
    const buttons = screen.getAllByRole("button");
    const dismissBtn = buttons.find((b) => b.getAttribute("aria-label") !== "send feedback");
    expect(dismissBtn).toBeDefined();
    fireEvent.click(dismissBtn!);
    expect(screen.queryByRole("button", { name: /send feedback/i })).not.toBeInTheDocument();
  });
});

describe("FeedbackForm", () => {
  it("renders message textarea", () => {
    renderFeedbackForm([readUsersMock]);
    expect(screen.getByPlaceholderText(/please enter any feedback/i)).toBeInTheDocument();
  });

  it("submit button is disabled when message is empty", () => {
    renderFeedbackForm([readUsersMock]);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  it("submit button is enabled after typing a message", () => {
    renderFeedbackForm([readUsersMock]);
    fireEvent.change(screen.getByPlaceholderText(/please enter any feedback/i), {
      target: { value: "Test feedback" },
    });
    expect(screen.getByRole("button", { name: /submit/i })).not.toBeDisabled();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = jest.fn();
    renderFeedbackForm([readUsersMock], onClose);
    // The SmallCross close button
    const closeBtn = screen.getAllByRole("button").find((b) => b.getAttribute("disabled") === null && b !== screen.queryByRole("button", { name: /submit/i }));
    fireEvent.click(closeBtn!);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows 'No files uploaded' placeholder initially", () => {
    renderFeedbackForm([readUsersMock]);
    expect(screen.getByText(/no files uploaded/i)).toBeInTheDocument();
  });

  it("submits feedback and calls onClose on success", async () => {
    const onClose = jest.fn();
    renderFeedbackForm([createFeedbackSuccess], onClose);

    fireEvent.change(screen.getByPlaceholderText(/please enter any feedback/i), {
      target: { value: "Test feedback" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("SelectFeedbackStatus", () => {
  it("renders the current status label as button text", () => {
    const status = feedbackStatusList[0];
    const setStatus = jest.fn();
    render(<SelectFeedbackStatus status={status} setStatus={setStatus} />);
    expect(screen.getByRole("button")).toHaveTextContent(status.label);
  });
});
