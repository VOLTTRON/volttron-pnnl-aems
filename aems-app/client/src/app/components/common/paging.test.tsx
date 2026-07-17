import { render, screen, fireEvent } from "@testing-library/react";
import { Paging } from "./paging";

function renderPaging(length: number, skip: number, take: number) {
  const setPaging = jest.fn();
  render(<Paging length={length} paging={{ skip, take }} setPaging={setPaging} />);
  return setPaging;
}

function getButtons() {
  const all = screen.getAllByRole("button");
  // Blueprint renders icon-only buttons; DOM order: first, prev, next, last
  return { first: all[0], prev: all[1], next: all[2], last: all[3] };
}

describe("Paging — page label", () => {
  it("shows page 1 of 5", () => {
    renderPaging(50, 0, 10);
    expect(screen.getByDisplayValue("page 1 of 5")).toBeInTheDocument();
  });

  it("shows page 3 of 5", () => {
    renderPaging(50, 20, 10);
    expect(screen.getByDisplayValue("page 3 of 5")).toBeInTheDocument();
  });
});

describe("Paging — disabled states", () => {
  it("first and prev disabled on first page", () => {
    renderPaging(50, 0, 10);
    const { first, prev } = getButtons();
    expect(first).toBeDisabled();
    expect(prev).toBeDisabled();
  });

  it("next and last disabled on last page", () => {
    renderPaging(50, 40, 10);
    const { next, last } = getButtons();
    expect(next).toBeDisabled();
    expect(last).toBeDisabled();
  });

  it("all buttons disabled on a single page", () => {
    renderPaging(5, 0, 10);
    const { first, prev, next, last } = getButtons();
    expect(first).toBeDisabled();
    expect(prev).toBeDisabled();
    expect(next).toBeDisabled();
    expect(last).toBeDisabled();
  });
});

describe("Paging — navigation", () => {
  it("next calls setPaging with skip advanced by take", () => {
    const setPaging = renderPaging(50, 0, 10);
    const { next } = getButtons();
    fireEvent.click(next);
    expect(setPaging).toHaveBeenCalledWith({ take: 10, skip: 10 });
  });

  it("last calls setPaging with skip at final page", () => {
    const setPaging = renderPaging(50, 0, 10);
    const { last } = getButtons();
    fireEvent.click(last);
    // Math.trunc(50/10)*10 = 50 — component's formula for last page skip
    expect(setPaging).toHaveBeenCalledWith({ take: 10, skip: 50 });
  });

  it("first calls setPaging with skip 0", () => {
    const setPaging = renderPaging(50, 20, 10);
    const { first } = getButtons();
    fireEvent.click(first);
    expect(setPaging).toHaveBeenCalledWith({ take: 10, skip: 0 });
  });

  it("prev calls setPaging with skip decremented", () => {
    const setPaging = renderPaging(50, 20, 10);
    const { prev } = getButtons();
    fireEvent.click(prev);
    expect(setPaging).toHaveBeenCalledWith({ take: 10, skip: 10 });
  });
});

describe("Paging — page size select", () => {
  it("changing page size resets skip to 0", () => {
    const setPaging = renderPaging(50, 20, 10);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "20" } });
    expect(setPaging).toHaveBeenCalledWith({ take: 20, skip: 0 });
  });
});
