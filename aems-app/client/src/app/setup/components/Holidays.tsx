import { Button, InputGroup, Intent, Label, Menu, MenuItem, Popover } from "@blueprintjs/core";
import { DatePicker3 } from "@blueprintjs/datetime2";
import { IconNames } from "@blueprintjs/icons";
import { useState } from "react";
import { cloneDeep, isEmpty, merge } from "lodash";
import { Holiday, HolidayCreateDelete } from "./Holiday";
import {
  HolidayType as HolidayList,
  ObservanceType,
  DeepPartial,
  typeofNonNullable,
  typeofObject,
} from "@local/common";
import { HolidayType, ReadUnitQuery } from "@/graphql-codegen/graphql";

type UnitType = NonNullable<ReadUnitQuery["readUnit"]>;

interface HolidaysProps {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing: (editing: DeepPartial<UnitType> | null) => void;
  readOnly?: boolean;
  hideCustom?: boolean;
}

const holidayOrder = HolidayList.values.map((a) => a.label);

const minDate = new Date("2024-01-01");
minDate.setFullYear(2024, 0, 1);

const maxDate = new Date("2024-12-31");
maxDate.setFullYear(2024, 11, 31);

const dateFactory = () => {
  const date = new Date("2024-01-01");
  date.setFullYear(2024, 0, 1);
  return date;
};

function CreateHoliday({
  unit,
  editing,
  setEditing,
}: {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing: (editing: DeepPartial<UnitType> | null) => void;
}) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(dateFactory());
  const [observance, setObservance] = useState("");
  const [open, setOpen] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr auto",
        gap: "1rem",
        alignItems: "end",
        marginBottom: "1rem",
      }}
    >
      <div>
        <Label>
          <b>Holiday Label</b>
          <InputGroup type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Label>
      </div>
      <div>
        <Label>
          <b>Date</b>
          <Popover
            content={
              <DatePicker3
                canClearSelection={false}
                minDate={minDate}
                maxDate={maxDate}
                value={date}
                onChange={(d: any, u: any) => {
                  if (d) {
                    setDate(d);
                  }
                  setOpen(!u);
                }}
              />
            }
            isOpen={open}
            placement="bottom-start"
          >
            <Button rightIcon={IconNames.CALENDAR} onClick={() => setOpen(true)} minimal>
              {formatDate(date)}
            </Button>
          </Popover>
        </Label>
      </div>
      <div>
        <Label>
          <b>Observance</b>
          <Popover
            content={
              <Menu>
                <MenuItem text="Always on Date" onClick={() => setObservance("")} />
                {ObservanceType.values.map((o: any) => (
                  <MenuItem key={o.name} text={o.label} onClick={() => setObservance(o.label)} />
                ))}
              </Menu>
            }
            placement="bottom-start"
          >
            <Button rightIcon={IconNames.CARET_DOWN} minimal>
              {observance || "Always on Date"}
            </Button>
          </Popover>
        </Label>
      </div>
      <div>
        <Button
          icon={IconNames.NEW_LAYER}
          intent={Intent.PRIMARY}
          minimal
          disabled={isEmpty(label)}
          onClick={() => {
            const now = new Date().toISOString();
            const clone = cloneDeep(editing ?? {});
            clone.configuration = clone.configuration ?? {};
            clone.configuration.holidays = clone.configuration.holidays ?? [];
            clone.configuration.holidays.push({
              id: `${now}`,
              type: HolidayType.Custom,
              label,
              month: date.getMonth() + 1,
              day: date.getDate(),
              observance,
              configurationId: unit?.configuration?.id ?? unit?.configurationId,
              createdAt: now,
              action: "create",
            } as HolidayCreateDelete);
            setEditing(clone);
            setLabel("");
            setDate(dateFactory());
            setObservance("");
          }}
        >
          Create Holiday
        </Button>
      </div>
    </div>
  );
}

export function Holidays({ unit, editing, setEditing, readOnly = false, hideCustom = false }: HolidaysProps) {
  const editingHolidays = (editing?.configuration?.holidays ?? [])
    .filter(typeofNonNullable)
    .reduce((a, h) => ({ ...a, [h?.id ?? ""]: h }), {} as Record<string, HolidayCreateDelete>);
  const holidays = (unit?.configuration?.holidays ?? [])
    .filter(typeofNonNullable)
    .map((h) => merge({}, h, h.id ? editingHolidays[h.id] : undefined)) as HolidayCreateDelete[];
  Object.values(editingHolidays)
    .filter((h) => typeofObject<HolidayCreateDelete>(h, (h) => h.action === "create"))
    .forEach((h) => holidays.push(h));

  return (
    <div style={{ padding: "1rem" }}>
      {!hideCustom && (
        <>
          <Label>
            <h3>Create Holiday</h3>
            <CreateHoliday unit={unit} editing={editing} setEditing={setEditing} />
          </Label>

          <Label>
            <h3>Custom Holidays</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {isEmpty(holidays.filter((a) => a.type === "Custom" && a.action !== "delete")) ? (
                <li
                  key={"empty"}
                  style={{ padding: "1rem", textAlign: "center", color: "var(--bp5-text-color-muted)" }}
                >
                  No Custom Holidays Defined
                </li>
              ) : (
                holidays
                  .filter((a) => a.type === "Custom" && a.action !== "delete")
                  .sort((a, b) => {
                    const aDate = new Date(a.createdAt || 0).valueOf();
                    const bDate = new Date(b.createdAt || 0).valueOf();
                    return bDate - aDate;
                  })
                  .map((holiday, i) => (
                    <li key={holiday.id ?? i} style={{ marginBottom: "0.5rem" }}>
                      <Holiday
                        key={holiday.id ?? i}
                        id={holiday.id ?? ""}
                        unit={unit}
                        editing={editing}
                        setEditing={setEditing}
                        readOnly={readOnly}
                      />
                    </li>
                  ))
              )}
            </ul>
          </Label>
        </>
      )}

      <Label>
        <h3>Predefined Holidays</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {holidays
            .filter((a) => a.type !== "Custom")
            .sort((a, b) => holidayOrder.indexOf(a.label || "") - holidayOrder.indexOf(b.label || ""))
            .map((holiday) => (
              <li key={holiday.id} style={{ marginBottom: "0.5rem" }}>
                <Holiday
                  key={holiday.id}
                  id={holiday.id ?? ""}
                  unit={unit}
                  editing={editing}
                  setEditing={setEditing}
                  readOnly={readOnly}
                />
              </li>
            ))}
        </ul>
      </Label>
    </div>
  );
}
