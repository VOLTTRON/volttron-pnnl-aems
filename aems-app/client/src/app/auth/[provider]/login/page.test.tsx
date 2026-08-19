import { render, screen, waitFor } from "@testing-library/react";
import { CurrentContext, LoadingContext, NotificationContext } from "@/app/components/providers";

const mockPush = jest.fn();
const mockSearchParamsGet = jest.fn(() => null);

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockSearchParamsGet, toString: () => "" }),
}));

const mockProviderInfo = {
  local: {
    name: "local",
    label: "Local",
    endpoint: "/auth/local/login",
    credentials: {
      email: { label: "Email", type: "text", placeholder: "Enter email" },
      password: { label: "Password", type: "password", placeholder: "Enter password" },
    },
  },
};

global.fetch = jest.fn((url: RequestInfo | URL) => {
  const urlStr = url.toString();
  if (urlStr.includes("/api/auth") && !urlStr.includes("/login")) {
    return Promise.resolve({
      ok: true,
      json: async () => mockProviderInfo,
    } as unknown as Response);
  }
  return Promise.resolve({
    ok: true,
    redirected: false,
    status: 200,
    json: async () => ({}),
  } as unknown as Response);
});

const mockLoadingCtx = {
  loadings: [],
  createLoading: jest.fn(() => ({ id: "l1", timestamp: 0, type: 1 })),
  clearLoading: jest.fn(),
};

const mockCurrentCtx = {
  current: null,
  loading: false,
  updateCurrent: jest.fn(),
  refetchCurrent: jest.fn(),
};

const mockNotificationCtx = {
  createNotification: jest.fn(),
};

function renderPage(provider = "local") {
  const Page = require("./page").default;
  return render(
    <CurrentContext.Provider value={mockCurrentCtx}>
      <LoadingContext.Provider value={mockLoadingCtx}>
        <NotificationContext.Provider value={mockNotificationCtx}>
          <Page params={Promise.resolve({ provider })} />
        </NotificationContext.Provider>
      </LoadingContext.Provider>
    </CurrentContext.Provider>,
  );
}

describe("Login page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders without crashing initially", () => {
    const { container } = renderPage();
    expect(container).toBeDefined();
  });

  it("renders the Continue button (disabled while provider loads)", () => {
    renderPage();
    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("renders credential fields after provider info loads", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).not.toBeDisabled();
  });
});
