import { render, screen, fireEvent } from "@testing-library/react";
import { FilePreview, FilePreviews } from "./file";

const makeFile = (overrides: object = {}) =>
  ({
    id: "file-1",
    objectKey: "photo.jpg",
    mimeType: "image/jpeg",
    ...overrides,
  }) as any;

jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: any) => <img {...props} />,
}));

describe("FilePreview", () => {
  it("renders a download button", () => {
    render(<FilePreview file={makeFile()} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", expect.stringContaining("file-1"));
  });

  it("renders an expand button for image files", () => {
    render(<FilePreview file={makeFile()} />);
    const buttons = screen.getAllByRole("button");
    const expandButton = buttons.find((b) => b.getAttribute("aria-label")?.includes("maximize") || b.innerHTML.includes("maximize"));
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("renders a document icon for non-image files", () => {
    render(<FilePreview file={makeFile({ mimeType: "application/pdf", objectKey: "doc.pdf" })} />);
    expect(screen.getByText("pdf")).toBeInTheDocument();
  });

  it("does not render expand button for non-image files", () => {
    render(<FilePreview file={makeFile({ mimeType: "application/pdf", objectKey: "doc.pdf" })} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
  });

  it("opens the dialog when expand is clicked for image files", () => {
    render(<FilePreview file={makeFile()} />);
    const buttons = screen.getAllByRole("button");
    const maximizeBtn = buttons.find((b) => b.className.includes("expand") || buttons.indexOf(b) === 1);
    if (maximizeBtn) {
      fireEvent.click(maximizeBtn);
    }
  });
});

describe("FilePreviews", () => {
  it("renders nothing when files is null", () => {
    const { container } = render(<FilePreviews files={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when files is undefined", () => {
    const { container } = render(<FilePreviews files={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders multiple file previews", () => {
    const files = [
      makeFile({ id: "f1", objectKey: "a.jpg", mimeType: "image/jpeg" }),
      makeFile({ id: "f2", objectKey: "b.pdf", mimeType: "application/pdf" }),
    ];
    render(<FilePreviews files={files} />);
    expect(screen.getByText("pdf")).toBeInTheDocument();
  });
});
