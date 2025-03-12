import { Alert, Button, InputGroup, Intent, Label, Menu, MenuItem } from "@blueprintjs/core";
import { HolidayType, ObservanceType } from "common";
import { IHoliday, deleteHoliday } from "controllers/holidays/action";
import { get, isEmpty, merge } from "lodash";

import { DatePicker } from "@blueprintjs/datetime";
import { Holiday } from "./Holiday";
import { IUnit } from "controllers/units/action";
import { IconNames } from "@blueprintjs/icons";
import { Popover2 } from "@blueprintjs/popover2";
import moment from "moment";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { DeepPartial } from "../../utils/types";

const holidayOrder = HolidayType.values.map((a) => a.label);

const minDate = new Date("2024-01-01");
minDate.setFullYear(2024, 0, 1);

const maxDate = new Date("2024-12-31");
maxDate.setFullYear(2024, 11, 31);

const dateFactory = () => {
  const date = new Date("2024-01-01");
  date.setFullYear(2024, 0, 1);
  return date;
};

function CreateHoliday(props: {
  unit: DeepPartial<IUnit> | IUnit;
  editing: DeepPartial<IUnit> | null;
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
  holidays: IHoliday[];
}) {
  const { unit, editing, handleChange, holidays } = props;

  const [label, setLabel] = useState("");
  const [date, setDate] = useState(dateFactory());
  const [observance, setObservance] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="row">
      <div className="label">
        <Label>
          <b>Holiday Label</b>
          <InputGroup type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Label>
      </div>
      <div>
        <Label>
          <b>Date</b>
          <Popover2
            content={
              <DatePicker
                canClearSelection={false}
                minDate={minDate}
                maxDate={maxDate}
                value={date}
                onChange={(d, u) => {
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
              {moment(date).format("MMMM Do")}
            </Button>
          </Popover2>
        </Label>
      </div>
      <div>
        <Label>
          <b>Observance</b>
          <Popover2
            content={
              <Menu>
                <MenuItem text="Always on Date" onClick={() => setObservance("")} />
                {ObservanceType.values.map((o) => (
                  <MenuItem key={o.name} text={o.label} onClick={() => setObservance(o.label)} />
                ))}
              </Menu>
            }
            placement="bottom-start"
          >
            <Button rightIcon={IconNames.CARET_DOWN} minimal>
              {observance || "Always on Date"}
            </Button>
          </Popover2>
        </Label>
      </div>
      <div>
        <Button
          icon={IconNames.NEW_LAYER}
          intent={Intent.PRIMARY}
          minimal
          disabled={isEmpty(label) || holidays.find((v) => v.label === label) !== undefined}
          onClick={() => {
            const i = Math.max(
              get(unit, "configuration.holidays.length", 0),
              get(editing, "configuration.holidays.length", 0)
            );
            handleChange(
              `configuration.holidays.${i}`,
              editing
            )({
              type: "Custom",
              label,
              month: date.getMonth() + 1,
              day: date.getDate(),
              observance,
              configurationId: unit?.configuration?.id,
              createdAt: moment().format(),
              action: "create",
            } as IHoliday);
            setLabel("");
            setDate(new Date());
            setObservance("");
          }}
        >
          Create Holiday
        </Button>
      </div>
    </div>
  );
}

export function Holidays(props: {
  unit: DeepPartial<IUnit> | IUnit;
  editing: DeepPartial<IUnit> | null;
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
  readOnly?: boolean;
}) {
  const { unit, editing, handleChange, readOnly } = props;

  const dispatch = useDispatch();
  const [deleting, setDeleting] = useState(undefined as DeepPartial<IHoliday> | undefined);

  const holidays = merge([], unit.configuration?.holidays, get(editing, "configuration.holidays")) as (IHoliday & {
    index: number;
  })[];
  holidays.forEach((h, i) => (h.index = i));
  return (
    <>
      {!readOnly && (
        <Label>
          <h3>Create Holiday</h3>
          <CreateHoliday unit={unit} editing={editing} handleChange={handleChange} holidays={holidays} />
        </Label>
      )}
      <Label>
        <h3>Custom Holidays</h3>
        <ul>
          {isEmpty(holidays.filter((a) => a.type === "Custom" && a.action !== "delete")) ? (
            <li key={"empty"}>No Custom Holidays Defined</li>
          ) : (
            holidays
              .filter((a) => a.type === "Custom" && a.action !== "delete")
              .sort((a, b) => moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf())
              .map((holiday, i) => (
                <li key={holiday.index}>
                  <Holiday
                    key={holiday.index}
                    path={`configuration.holidays.${holiday.index}`}
                    unit={unit}
                    editing={editing}
                    holiday={holiday}
                    handleChange={handleChange}
                    readOnly={readOnly}
                  />
                </li>
              ))
          )}
        </ul>
      </Label>
      <Label>
        <h3>Predefined Holidays</h3>
        <ul>
          {holidays
            .filter((a) => a.type !== "Custom")
            .sort((a, b) => holidayOrder.indexOf(a.label) - holidayOrder.indexOf(b.label))
            .map((holiday, i) => (
              <li key={holiday.index}>
                <Holiday
                  key={holiday.index}
                  path={`configuration.holidays.${holiday.index}`}
                  unit={unit}
                  editing={editing}
                  holiday={holiday}
                  handleChange={handleChange}
                  readOnly={readOnly}
                />
              </li>
            ))}
        </ul>
      </Label>
      <Alert
        intent={Intent.DANGER}
        isOpen={deleting !== undefined}
        confirmButtonText="Yes"
        cancelButtonText="Cancel"
        onConfirm={() => dispatch(deleteHoliday(deleting?.id ?? -1))}
        onClose={() => setDeleting(undefined)}
      >
        <p>Permanently delete the holiday {deleting?.label}?</p>
      </Alert>
    </>
  );
}
