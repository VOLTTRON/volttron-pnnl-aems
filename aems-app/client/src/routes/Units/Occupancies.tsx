import {
  Alert,
  Button,
  Checkbox,
  HandleInteractionKind,
  HandleType,
  InputGroup,
  Intent,
  Label,
  MultiSlider,
} from "@blueprintjs/core";
import {
  END_TIME_DEFAULT,
  END_TIME_MAX,
  START_TIME_DEFAULT,
  START_TIME_MIN,
  TIME_PADDING,
  createScheduleLabel,
  toDataFormat,
  toMinutes,
  toTimeFormat,
} from "utils/schedule";
import { IOccupancy, deleteOccupancy } from "controllers/occupancies/action";
import { clamp, clone, cloneDeep, get, inRange, isEmpty, merge } from "lodash";
import { useCallback, useState } from "react";

import { DatePicker } from "@blueprintjs/datetime";
import { ISchedule } from "controllers/schedules/action";
import { IUnit } from "controllers/units/action";
import { IconNames } from "@blueprintjs/icons";
import { Occupancy } from "./Occupancy";
import { Popover2 } from "@blueprintjs/popover2";
import moment from "moment";
import { parseBoolean } from "utils/utils";
import { useDispatch } from "react-redux";
import { DeepPartial } from "../../utils/types";

const allowUnoccupied = parseBoolean(process.env.REACT_APP_ALLOW_UNOCCUPIED || "");

const defaultSchedule: ISchedule = {
  label: "",
  occupied: true,
  startTime: toDataFormat(START_TIME_DEFAULT),
  endTime: toDataFormat(END_TIME_DEFAULT),
};
defaultSchedule.label = createScheduleLabel("all", defaultSchedule);

function CreateOccupancy(props: {
  unit: IUnit;
  editing: DeepPartial<IUnit> | null;
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
}) {
  const { unit, editing, handleChange } = props;

  const [label, setLabel] = useState("");
  const [date, setDate] = useState(new Date());
  const [schedule, setSchedule] = useState(clone(defaultSchedule));
  const [open, setOpen] = useState(false);

  const getValue = useCallback((field: string) => get(editing, field, get(unit, field)), [editing, unit]);

  const day = moment(date).format("dddd").toLowerCase();
  const values = {
    schedule: {
      start: !schedule.occupied ? START_TIME_MIN : toMinutes(schedule.startTime, false),
      end: !schedule.occupied ? END_TIME_MAX : toMinutes(schedule.endTime, true),
    },
    previous: {
      start: !getValue(`configuration.${day}Schedule.occupied`)
        ? START_TIME_MIN
        : toMinutes(getValue(`configuration.${day}Schedule.startTime`), false),
      end: !getValue(`configuration.${day}Schedule.occupied`)
        ? END_TIME_MAX
        : toMinutes(getValue(`configuration.${day}Schedule.endTime`), true),
      occupied: getValue(`configuration.${day}Schedule.occupied`),
    },
  };

  return (
    <div className="row">
      <div className="label">
        <Label>
          <b>Occupancy Label</b>
          <InputGroup type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Label>
      </div>
      <div className="row">
        <div className="label">
          <Label>
            <b>Occupancy Schedule</b>
            <InputGroup type="text" value={schedule.label} readOnly />
          </Label>
        </div>
        <div className="occupancy">
          <MultiSlider
            min={START_TIME_MIN}
            max={END_TIME_MAX}
            stepSize={5}
            labelStepSize={240}
            labelRenderer={(v, o) =>
              o?.isHandleTooltip || (v > START_TIME_MIN && v < END_TIME_MAX) ? toTimeFormat(v) : ""
            }
            disabled={!schedule.occupied}
          >
            <MultiSlider.Handle
              type={HandleType.START}
              interactionKind={HandleInteractionKind.LOCK}
              intentAfter={!schedule.occupied ? Intent.NONE : Intent.SUCCESS}
              value={values.schedule.start}
              onChange={(v) => {
                const copy = cloneDeep(schedule);
                const occupied = schedule.occupied;
                const endTime = toMinutes(schedule.endTime, true);
                const startTime = clamp(v, START_TIME_MIN, Math.min(endTime, END_TIME_MAX) - TIME_PADDING);
                const label = createScheduleLabel("all", {
                  occupied,
                  startTime,
                  endTime,
                });
                merge(copy, {
                  startTime: toDataFormat(startTime),
                  label,
                });
                setSchedule(copy);
              }}
            />
            <MultiSlider.Handle
              type={HandleType.START}
              interactionKind={HandleInteractionKind.NONE}
              intentAfter={
                !values.previous.occupied
                  ? Intent.NONE
                  : inRange(values.previous.start, values.schedule.start, values.schedule.end)
                  ? Intent.SUCCESS
                  : Intent.PRIMARY
              }
              value={values.previous.start}
            />
            <MultiSlider.Handle
              type={HandleType.END}
              interactionKind={HandleInteractionKind.NONE}
              intentBefore={
                !values.previous.occupied
                  ? Intent.NONE
                  : inRange(values.previous.end, values.schedule.start, values.schedule.end)
                  ? Intent.SUCCESS
                  : Intent.PRIMARY
              }
              value={values.previous.end}
            />
            <MultiSlider.Handle
              type={HandleType.END}
              interactionKind={HandleInteractionKind.LOCK}
              intentBefore={!schedule.occupied ? Intent.NONE : Intent.SUCCESS}
              value={values.schedule.end}
              onChange={(v) => {
                const copy = cloneDeep(schedule);
                const occupied = schedule.occupied;
                const startTime = toMinutes(schedule.startTime, false);
                const endTime = clamp(v, Math.max(startTime, START_TIME_MIN) + TIME_PADDING, END_TIME_MAX);
                const label = createScheduleLabel("all", {
                  occupied,
                  startTime,
                  endTime,
                });
                merge(copy, {
                  endTime: toDataFormat(endTime),
                  label,
                });
                setSchedule(copy);
              }}
            />
          </MultiSlider>
        </div>
        {allowUnoccupied ? (
          <div className="unoccupied">
            <Checkbox
              label="Unoccupied"
              checked={!schedule.occupied}
              onClick={() => {
                const copy = cloneDeep(schedule);
                const occupied = !schedule.occupied;
                const startTime = toMinutes(schedule.startTime, false);
                const endTime = toMinutes(schedule.endTime, true);
                const label = createScheduleLabel("all", { occupied, startTime, endTime });
                merge(copy, {
                  occupied,
                  label,
                });
                setSchedule(copy);
              }}
            />
          </div>
        ) : (
          <div />
        )}
      </div>
      <div>
        <Label>
          <b>Date</b>
          <Popover2
            content={
              <DatePicker
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
              {moment(date).format("dddd MMMM Do YYYY")}
            </Button>
          </Popover2>
        </Label>
      </div>
      <div>
        <Button
          icon={IconNames.NEW_LAYER}
          intent={Intent.PRIMARY}
          minimal
          onClick={() => {
            const i = Math.max(
              get(unit, "configuration.occupancies.length", 0),
              get(editing, "configuration.occupancies.length", 0)
            );
            handleChange(
              `configuration.occupancies.${i}`,
              editing
            )({
              label: label,
              date: date.toISOString(),
              schedule: schedule,
              configurationId: unit?.configuration?.id,
              createdAt: moment().format(),
              action: "create",
            } as IOccupancy);
            setLabel("");
            setDate(new Date());
            setSchedule(clone(defaultSchedule));
          }}
        >
          Create Occupancy
        </Button>
      </div>
    </div>
  );
}

export function Occupancies(props: {
  unit: IUnit;
  editing: DeepPartial<IUnit> | null;
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
}) {
  const { unit, editing, handleChange } = props;

  const dispatch = useDispatch();
  const [deleting, setDeleting] = useState(undefined as DeepPartial<IOccupancy> | undefined);

  const occupancies = merge(
    [],
    unit.configuration?.occupancies,
    get(editing, "configuration.occupancies")
  ) as (IOccupancy & {
    index: number;
  })[];
  occupancies.forEach((h, i) => (h.index = i));
  return (
    <>
      <Label>
        <h3>Create Occupancy</h3>
        <CreateOccupancy unit={unit} editing={editing} handleChange={handleChange} />
      </Label>
      <Label>
        <h3>Temporary Occupancies</h3>
        <ul>
          {isEmpty(occupancies.filter((a) => a.action !== "delete")) ? (
            <li key={"empty"}>No Temporary Occupancies Defined</li>
          ) : (
            occupancies
              .filter((a) => a.action !== "delete")
              .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf())
              .map((occupancy, i) => (
                <li key={occupancy.index}>
                  <Occupancy
                    key={occupancy.index}
                    path={`configuration.occupancies.${occupancy.index}`}
                    unit={unit}
                    editing={editing}
                    occupancy={occupancy}
                    handleChange={handleChange}
                  />
                </li>
              ))
          )}
        </ul>
      </Label>
      <Alert
        intent={Intent.DANGER}
        isOpen={deleting !== undefined}
        confirmButtonText="Yes"
        cancelButtonText="Cancel"
        onConfirm={() => dispatch(deleteOccupancy(deleting?.id ?? -1))}
        onClose={() => setDeleting(undefined)}
      >
        <p>Permanently delete the occupancy {deleting?.label}?</p>
      </Alert>
    </>
  );
}
