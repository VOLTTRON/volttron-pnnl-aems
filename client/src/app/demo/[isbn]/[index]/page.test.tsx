import { render, screen } from "@testing-library/react";

const mockFindBook = jest.fn();

jest.mock("../../books", () => ({
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

describe("Demo [isbn]/[index] page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders chapter title and book title when both are found", async () => {
    mockFindBook.mockResolvedValue(mockBook);
    const Page = require("./page").default;
    const element = await Page({
      params: Promise.resolve({ isbn: "978-0-316-12908-4", index: "0" }),
    });
    render(element);

    expect(screen.getByText("Leviathan Wakes")).toBeInTheDocument();
    expect(screen.getByText("Prologue")).toBeInTheDocument();
  });

  it("renders lorem ipsum body text", async () => {
    mockFindBook.mockResolvedValue(mockBook);
    const Page = require("./page").default;
    const element = await Page({
      params: Promise.resolve({ isbn: "978-0-316-12908-4", index: "1" }),
    });
    render(element);

    expect(screen.getByText(/Lorem ipsum/i)).toBeInTheDocument();
  });

  it("renders 'Book not found' when findBook returns undefined", async () => {
    mockFindBook.mockResolvedValue(undefined);
    const Page = require("./page").default;
    const element = await Page({
      params: Promise.resolve({ isbn: "not-a-real-isbn", index: "0" }),
    });
    render(element);

    expect(screen.getByText("Book not found")).toBeInTheDocument();
  });

  it("renders 'Chapter not found' when chapter index is out of bounds", async () => {
    mockFindBook.mockResolvedValue(mockBook);
    const Page = require("./page").default;
    const element = await Page({
      params: Promise.resolve({ isbn: "978-0-316-12908-4", index: "999" }),
    });
    render(element);

    expect(screen.getByText("Chapter not found")).toBeInTheDocument();
  });
});
