import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { LoadingContext } from "@/app/components/providers";
import { NotificationContext, NotificationType } from "@/app/components/providers";

const mockPush = jest.fn();
const mockFindBooks = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock("./books", () => ({
  findBooks: () => mockFindBooks(),
  findBook: jest.fn(),
}));

jest.mock("./palette", () => ({
  PaletteDemo: () => null,
}));

jest.mock("./chart", () => ({
  Chart: () => null,
}));

jest.mock("./locations", () => ({
  Locations: () => null,
}));

jest.mock("./map", () => ({
  Map: () => null,
}));

jest.mock("../components/common/map", () => ({
  GeographyPicker: () => null,
}));

// Load the page (and its transitive imports) once at file scope so ts-jest transformation
// and coverage instrumentation happen during setup, not inside the first `it`'s timeout budget.
import Page from "./page";

const mockCreateLoading = jest.fn();
const mockClearLoading = jest.fn();
const mockCreateNotification = jest.fn();

const mockBook = {
  id: 1,
  title: "Leviathan Wakes",
  author: "James S. A. Corey",
  isbn: "978-0-316-12908-4",
  pages: 561,
  duration: "20h 56m",
  date: "June 15, 2011",
  chapters: [{ title: "Prologue", pages: 1 }],
};

function renderPage() {
  return render(
    <LoadingContext.Provider
      value={{ createLoading: mockCreateLoading, clearLoading: mockClearLoading }}
    >
      <NotificationContext.Provider value={{ createNotification: mockCreateNotification }}>
        <Page />
      </NotificationContext.Provider>
    </LoadingContext.Provider>,
  );
}

describe("Demo page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindBooks.mockResolvedValue([mockBook]);
  });

  it("renders without crashing", async () => {
    await act(async () => {
      renderPage();
    });
    await waitFor(() => expect(mockFindBooks).toHaveBeenCalled());
  });

  it("renders all section headings", async () => {
    await act(async () => {
      renderPage();
    });
    const sections = [
      "Palette",
      "Loading",
      "Error",
      "Notification",
      "Charts",
      "Dynamic Routing",
      "Nominatim",
      "Mapbox",
      "Geography Picker",
    ];
    for (const title of sections) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("renders Start Global Loading button when Loading section is opened", async () => {
    await act(async () => {
      renderPage();
    });
    fireEvent.click(screen.getByText("Loading"));
    expect(screen.getByText("Start Global Loading")).toBeInTheDocument();
  });

  it("renders Throw Error button when Error section is opened", async () => {
    await act(async () => {
      renderPage();
    });
    fireEvent.click(screen.getByText("Error"));
    expect(screen.getByText("Throw Error")).toBeInTheDocument();
  });

  it("renders Send Notification and Send Error buttons when Notification section is opened", async () => {
    await act(async () => {
      renderPage();
    });
    fireEvent.click(screen.getByText("Notification"));
    expect(screen.getByText("Send Notification")).toBeInTheDocument();
    expect(screen.getByText("Send Error")).toBeInTheDocument();
  });

  it("calls createNotification with notification type when Send Notification is clicked", async () => {
    await act(async () => {
      renderPage();
    });
    // Open the Notification section first
    fireEvent.click(screen.getByText("Notification"));
    fireEvent.click(screen.getByText("Send Notification"));
    expect(mockCreateNotification).toHaveBeenCalledWith("Hello World!", NotificationType.Notification);
  });

  it("calls createNotification with error type when Send Error is clicked", async () => {
    await act(async () => {
      renderPage();
    });
    fireEvent.click(screen.getByText("Notification"));
    fireEvent.click(screen.getByText("Send Error"));
    expect(mockCreateNotification).toHaveBeenCalledWith("You broke it!", NotificationType.Error);
  });

  it("renders the book title in the table when Dynamic Routing section is opened", async () => {
    await act(async () => {
      renderPage();
    });
    fireEvent.click(screen.getByText("Dynamic Routing"));
    await waitFor(() => {
      expect(screen.getByText("Leviathan Wakes")).toBeInTheDocument();
    });
  });

  it("calls findBooks on mount", async () => {
    await act(async () => {
      renderPage();
    });
    expect(mockFindBooks).toHaveBeenCalled();
  });
});
