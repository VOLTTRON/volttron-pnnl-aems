import { render, screen, act } from "@testing-library/react";
import { RouteContext } from "@/app/components/providers";
import { staticRoutes } from "@/app/routes";

const mockFindBook = jest.fn();

jest.mock("../books", () => ({
  findBook: (isbn: string) => mockFindBook(isbn),
}));

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

function renderLayout(resolvers = {}, addResolver = jest.fn()) {
  const Layout = require("./layout").default;
  return render(
    <RouteContext.Provider
      value={{
        routes: staticRoutes,
        route: undefined,
        items: [],
        resolvers,
        addResolver,
        removeResolver: jest.fn(),
      }}
    >
      <Layout><span>child content</span></Layout>
    </RouteContext.Provider>,
  );
}

describe("Demo [isbn] layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindBook.mockResolvedValue(mockBook);
  });

  it("renders children without crashing", async () => {
    await act(async () => {
      renderLayout();
    });
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("calls addResolver with 'book' when book resolver is not registered", async () => {
    const addResolver = jest.fn();
    await act(async () => {
      renderLayout({}, addResolver);
    });
    expect(addResolver).toHaveBeenCalledWith("book", expect.any(Function));
  });

  it("does not call addResolver when 'book' is already in resolvers", async () => {
    const addResolver = jest.fn();
    await act(async () => {
      renderLayout({ book: jest.fn() }, addResolver);
    });
    expect(addResolver).not.toHaveBeenCalled();
  });
});
