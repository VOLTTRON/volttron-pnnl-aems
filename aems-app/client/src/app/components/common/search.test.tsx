import { render, screen, fireEvent, act } from "@testing-library/react";
import { Search } from "./search";

describe("Search — controlled mode", () => {
  it("renders with provided value", () => {
    render(<Search value="hello" onValueChange={jest.fn()} />);
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });

  it("clear button click calls onValueChange with empty string", () => {
    const onValueChange = jest.fn();
    render(<Search value="hello" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onValueChange).toHaveBeenCalledWith("", null);
  });

  it("clear button is disabled when value is empty string", () => {
    render(<Search value="" onValueChange={jest.fn()} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("Search — debounced mode", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls setSearch after debounce delay", () => {
    const setSearch = jest.fn();
    render(<Search debounced={{ search: "", setSearch, delay: 400 }} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    act(() => {
      jest.runAllTimers();
    });
    expect(setSearch).toHaveBeenCalledWith("abc");
  });

  it("clear button resets local search", () => {
    const setSearch = jest.fn();
    render(<Search debounced={{ search: "pre", setSearch }} />);
    fireEvent.click(screen.getByRole("button"));
    act(() => {
      jest.runAllTimers();
    });
    expect(setSearch).toHaveBeenCalledWith("");
  });
});

describe("Search — loading indicator", () => {
  it("shows spin class when loading is true", () => {
    const { container } = render(<Search loading={true} value="" onValueChange={jest.fn()} />);
    expect(container.querySelector(".spin")).toBeInTheDocument();
  });

  it("does not show spin class when loading is false", () => {
    const { container } = render(<Search loading={false} value="" onValueChange={jest.fn()} />);
    expect(container.querySelector(".spin")).not.toBeInTheDocument();
  });
});
