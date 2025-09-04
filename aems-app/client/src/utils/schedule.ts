import { isNumber, sum } from "lodash";
import moment from "moment";

// Constants for schedule validation and defaults
const TIME_PADDING = 120;
const START_TIME_MIN = 0 * 60;
const START_TIME_DEFAULT = 8 * 60;
const END_TIME_MAX = 24 * 60;
const END_TIME_DEFAULT = 18 * 60;
const DATA_FORMAT = "HH:mm";
const TIME_FORMAT = "h:mm\xa0a";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface ISchedule {
  id?: number;
  label?: string;
  startTime: string;
  endTime: string;
  occupied?: boolean;
  _count?: Record<string, number>;
}

type Required = "startTime" | "endTime";

const toDataFormat = (value: number) =>
  moment("00:00", [DATA_FORMAT])
    .add(Math.trunc(value / 60), "hours")
    .add(value % 60, "minutes")
    .format(DATA_FORMAT);

const toTimeFormat = (value: number) =>
  moment("00:00", [DATA_FORMAT])
    .add(Math.trunc(value / 60), "hours")
    .add(value % 60, "minutes")
    .format(TIME_FORMAT);

const toUpperBound = (value: number, boundary: number, upper?: boolean) => (upper && value === 0 ? boundary : value);

const toMinutes = (value?: string, upper?: boolean) =>
  toUpperBound(moment(value, [DATA_FORMAT, TIME_FORMAT]).hours(), 24, upper) * 60 +
  moment(value, [DATA_FORMAT, TIME_FORMAT]).minutes();

const createScheduleLabel = (
  type: "all" | Required,
  schedule:
    | (DeepPartial<ISchedule> & Pick<ISchedule, Required>)
    | { occupied?: boolean; startTime: number; endTime: number }
): string => {
  const occupied = schedule?.occupied === undefined ? true : schedule.occupied;
  const startTime = isNumber(schedule.startTime) ? schedule.startTime : toMinutes(schedule.startTime, false);
  const endTime = isNumber(schedule.endTime) ? schedule.endTime : toMinutes(schedule.endTime, true);
  switch (type) {
    case "startTime":
      return `${toTimeFormat(startTime)}`;
    case "endTime":
      return `${toTimeFormat(endTime)}`;
    case "all":
    default:
      return occupied
        ? startTime === 0 && endTime === 1440
          ? "Occupied All Day"
          : `Occupied From Start Time: ${toTimeFormat(startTime)} To End Time: ${toTimeFormat(endTime)}`
        : "Unoccupied All Day";
  }
};

const getScheduleMessage = (schedule: DeepPartial<ISchedule> & Pick<ISchedule, Required>): string | undefined => {
  return undefined;
};

const isScheduleValid = (schedule: DeepPartial<ISchedule> & Pick<ISchedule, Required>): boolean => {
  return getScheduleMessage(schedule) === undefined;
};

const isScheduleDelete = (schedule: DeepPartial<ISchedule>) => {
  return sum(Object.values(schedule?._count || {})) === 0;
};

export {
  TIME_PADDING,
  START_TIME_MIN,
  START_TIME_DEFAULT,
  END_TIME_MAX,
  END_TIME_DEFAULT,
  DATA_FORMAT,
  TIME_FORMAT,
  toDataFormat,
  toTimeFormat,
  toMinutes,
  createScheduleLabel,
  getScheduleMessage,
  isScheduleValid,
  isScheduleDelete,
  type ISchedule,
};
