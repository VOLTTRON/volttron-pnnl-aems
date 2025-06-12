"use client";

import { renderTerm } from "@/utils/client";
import { Alignment, Button, ButtonGroup, HTMLTable, HTMLTableProps, Intent } from "@blueprintjs/core";
import { IconName, IconNames } from "@blueprintjs/icons";
import { xor } from "lodash";
import { MouseEvent } from "react";

export type ColumnType = "string" | "date" | "term" | "element";

export enum TupleIndex {
  Row = 0,
  Col = 1,
}

export function Table<T extends {}>({
  rowKey,
  rows,
  sortable,
  columns,
  actions,
  sort,
  setSort,
  selected,
  onSelected,
  setSelected,
  tableProps,
}: {
  rowKey: keyof T;
  rows: T[];
  sortable?: (keyof T)[];
  columns: ({
    field: keyof T;
    label: string;
    type?: ColumnType;
    renderer?: (col: number, row: number, value: any) => React.ReactNode;
  } & (
    | {
        type?: ColumnType;
      }
    | {
        renderer: (col: number, row: number, value: any) => React.ReactNode;
      }
  ))[];
  actions?: {
    values: { id: string; icon: IconName; intent?: Intent }[];
    onClick: (
      id: string,
      row: T,
      event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent> | MouseEvent<HTMLElement, globalThis.MouseEvent>,
      index: number
    ) => void;
    isDisabled?: (id: string, row: T) => boolean;
  };
  sort?: { field: keyof T; direction: "Asc" | "Desc" };
  setSort?: (sort: { field: keyof T; direction: "Asc" | "Desc" }) => void;
  selected?: { rows?: number[]; cells?: [number, number][]; rowKeys?: T[typeof rowKey][] };
  onSelected?: (row: number, col: number, rowKeys?: T[typeof rowKey]) => void;
  setSelected?: (selected: { rows?: number[]; cells?: [number, number][]; rowKeys?: T[typeof rowKey][] }) => void;
  tableProps?: HTMLTableProps;
}) {
  function handleSelect(row: number, col: number, rowKeys?: T[typeof rowKey]) {
    onSelected?.(row, col, rowKeys);
    setSelected?.({
      rows: xor(selected?.rows ?? [], [row]),
      cells: xor(selected?.cells ?? [], [[row, col]]),
      rowKeys: xor(selected?.rowKeys ?? [], rowKeys ? [rowKeys] : []),
    });
  }

  function renderValue(row: T, field: keyof T, type: ColumnType | undefined) {
    switch (type) {
      case "term":
        return renderTerm(row, field);
      case "date":
        return new Date(row[field] as any).toLocaleString();
      case "string":
        return row[field] as string;
      case "element":
        return row[field] as React.ReactNode;
      default:
        return `${row[field]}`;
    }
  }

  function renderHeader(field: keyof T, label: string) {
    if (!sort || !setSort || (sortable !== undefined && !sortable.includes(field))) {
      return (
        <Button alignText={Alignment.LEFT} minimal fill>
          <b>{label}</b>
        </Button>
      );
    }
    return (
      <Button
        onClick={() =>
          setSort({
            field: field,
            direction: sort.field === field && sort.direction === "Asc" ? "Desc" : "Asc",
          })
        }
        rightIcon={
          sort.field === field ? (sort.direction === "Asc" ? IconNames.CARET_UP : IconNames.CARET_DOWN) : undefined
        }
        alignText={Alignment.LEFT}
        minimal
        fill
      >
        <b>{label}</b>
      </Button>
    );
  }

  function renderActions(row: T, index: number) {
    if (!actions) {
      return null;
    }
    return (
      <ButtonGroup>
        {actions.values.map((a) => (
          <Button
            id={a.id}
            key={a.id}
            icon={a.icon}
            intent={a.intent}
            onClick={(e) => actions.onClick(a.id, row, e, index)}
            disabled={actions.isDisabled?.(a.id, row)}
            minimal
          />
        ))}
      </ButtonGroup>
    );
  }

  return (
    <HTMLTable interactive striped {...tableProps}>
      <thead>
        <tr>
          {columns.map(({ field, label }, c) => (
            <th key={c}>{renderHeader(field, label)}</th>
          ))}
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr
            key={`${row[rowKey] ?? r}`}
            {...((selected?.rows?.includes(r) || selected?.rowKeys?.includes(row[rowKey])) && { selected: "true" })}
          >
            {columns.map(({ field, type, renderer }, c) => (
              <td
                key={`${c}-${row[rowKey] ?? r}`}
                {...(selected?.cells?.find((v) => v[TupleIndex.Row] === r && v[TupleIndex.Col] === c) && {
                  selected: true,
                })}
                onClick={() => handleSelect(r, c)}
              >
                {renderer?.(c, r, row[field]) ?? renderValue(row, field, type)}
              </td>
            ))}
            <td>{renderActions(row, r)}</td>
          </tr>
        ))}
      </tbody>
    </HTMLTable>
  );
}
