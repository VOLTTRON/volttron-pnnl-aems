import { render, screen } from "@testing-library/react";

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
  chapters: [
    { title: "Prologue", pages: 1 },
    { title: "1: Holden", pages: 3 },
  ],
};

describe("Demo [isbn] page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders book details when book is found", async () => {
    mockFindBook.mockResolvedValue(mockBook);
    const Page = require("./page").default;
    const element = await Page({ params: Promise.resolve({ isbn: "978-0-316-12908-4" }) });
    render(element);

    expect(screen.getByText("Leviathan Wakes")).toBeInTheDocument();
    expect(screen.getByText("James S. A. Corey")).toBeInTheDocument();
    expect(screen.getByText("978-0-316-12908-4")).toBeInTheDocument();
    expect(screen.getByText("561")).toBeInTheDocument();
    expect(screen.getByText("20h 56m")).toBeInTheDocument();
    expect(screen.getByText("June 15, 2011")).toBeInTheDocument();
  });

  it("renders chapter links", async () => {
    mockFindBook.mockResolvedValue(mockBook);
    const Page = require("./page").default;
    const element = await Page({ params: Promise.resolve({ isbn: "978-0-316-12908-4" }) });
    render(element);

    expect(screen.getByText("Prologue")).toBeInTheDocument();
    expect(screen.getByText("1: Holden")).toBeInTheDocument();

    const prologueLink = screen.getByRole("link", { name: "Prologue" });
    expect(prologueLink).toHaveAttribute("href", "/demo/978-0-316-12908-4/0");

    const holdenLink = screen.getByRole("link", { name: "1: Holden" });
    expect(holdenLink).toHaveAttribute("href", "/demo/978-0-316-12908-4/1");
  });

  it("renders 'Book not found' when findBook returns undefined", async () => {
    mockFindBook.mockResolvedValue(undefined);
    const Page = require("./page").default;
    const element = await Page({ params: Promise.resolve({ isbn: "not-a-real-isbn" }) });
    render(element);

    expect(screen.getByText("Book not found")).toBeInTheDocument();
  });
});
