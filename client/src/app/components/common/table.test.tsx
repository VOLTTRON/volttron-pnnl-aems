import { render, screen, fireEvent } from "@testing-library/react";
import { Table } from "./table";

type Row = { id: string; name: string; amount: number; createdAt: string };

const rows: Row[] = [
  { id: "1", name: "Alice", amount: 100, createdAt: "2024-01-15T12:00:00.000Z" },
  { id: "2", name: "Bob", amount: 200, createdAt: "2024-02-20T08:00:00.000Z" },
];

const stringColumns = [
  { field: "name" as const, label: "Name", type: "string" as const },
  { field: "amount" as const, label: "Amount" },
];

describe("Table", () => {
  it("renders column headers", () => {
    render(<Table rowKey="id" rows={rows} columns={stringColumns} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });

  it("renders row data as strings by default", () => {
    render(<Table rowKey="id" rows={rows} columns={stringColumns} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders empty table when rows is empty", () => {
    render(<Table rowKey="id" rows={[]} columns={stringColumns} />);
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("formats date columns with toLocaleString", () => {
    const dateColumns = [{ field: "createdAt" as const, label: "Date", type: "date" as const }];
    render(<Table rowKey="id" rows={rows} columns={dateColumns} />);
    const expected = new Date("2024-01-15T12:00:00.000Z").toLocaleString();
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("uses custom renderer over default rendering", () => {
    const columns = [
      {
        field: "name" as const,
        label: "Name",
        renderer: (_c: number, _r: number, v: any) => <span data-testid="custom">{v}-custom</span>,
      },
    ];
    render(<Table rowKey="id" rows={rows} columns={columns} />);
    expect(screen.getAllByTestId("custom")[0].textContent).toBe("Alice-custom");
  });

  it("calls setSort with toggled direction on header click", () => {
    const setSort = jest.fn();
    const sort = { field: "name" as const, direction: "Asc" as const };
    render(
      <Table
        rowKey="id"
        rows={rows}
        columns={stringColumns}
        sort={sort}
        setSort={setSort}
        sortable={["name"]}
      />,
    );
    fireEvent.click(screen.getByText("Name").closest("button")!);
    expect(setSort).toHaveBeenCalledWith({ field: "name", direction: "Desc" });
  });

  it("toggles sort direction from Desc to Asc on second click", () => {
    const setSort = jest.fn();
    const sort = { field: "name" as const, direction: "Desc" as const };
    render(
      <Table
        rowKey="id"
        rows={rows}
        columns={stringColumns}
        sort={sort}
        setSort={setSort}
        sortable={["name"]}
      />,
    );
    fireEvent.click(screen.getByText("Name").closest("button")!);
    expect(setSort).toHaveBeenCalledWith({ field: "name", direction: "Asc" });
  });

  it("calls onSelected when a cell is clicked", () => {
    const onSelected = jest.fn();
    render(<Table rowKey="id" rows={rows} columns={stringColumns} onSelected={onSelected} />);
    fireEvent.click(screen.getByText("Alice"));
    // The <td> onClick calls handleSelect(rowIndex, colIndex) without the rowKey
    expect(onSelected).toHaveBeenCalledWith(0, 0, undefined);
  });

  it("renders action buttons", () => {
    const onClick = jest.fn();
    const actions = {
      values: [{ id: "edit", icon: "edit" as any, intent: undefined }],
      onClick,
    };
    const { container } = render(
      <Table rowKey="id" rows={rows} columns={stringColumns} actions={actions} />,
    );
    // Blueprint renders icon-only buttons; query by id attribute
    const buttons = container.querySelectorAll("button#edit");
    expect(buttons.length).toBe(2); // one per row
  });

  it("calls actions.onClick with correct row and index", () => {
    const onClick = jest.fn();
    const actions = {
      values: [{ id: "edit", icon: "edit" as any }],
      onClick,
    };
    const { container } = render(
      <Table rowKey="id" rows={rows} columns={stringColumns} actions={actions} />,
    );
    const buttons = container.querySelectorAll("button#edit");
    fireEvent.click(buttons[1]);
    expect(onClick).toHaveBeenCalledWith("edit", rows[1], expect.anything(), 1);
  });

  it("disables action button when isDisabled returns true", () => {
    const onClick = jest.fn();
    const actions = {
      values: [{ id: "edit", icon: "edit" as any }],
      onClick,
      isDisabled: (_id: string, row: Row) => row.id === "1",
    };
    const { container } = render(
      <Table rowKey="id" rows={rows} columns={stringColumns} actions={actions} />,
    );
    const buttons = container.querySelectorAll("button#edit");
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
  });
});
