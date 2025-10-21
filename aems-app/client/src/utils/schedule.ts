import { DeepPartial, Validate } from "@local/common";
import { isNumber, sum } from "lodash";

// Constants for schedule validation and defaults
const TIME_PADDING = 120;
const START_TIME_MIN = 0 * 60;
const END_TIME_MAX = 24 * 60;
const DATA_FORMAT = "HH:mm";
const TIME_FORMAT = "h:mm\xa0a";

// Helper function to parse time string in HH:mm format and return minutes from midnight
const parseTimeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to parse time string in various formats (HH:mm or h:mm a)
const parseTimeStringToMinutes = (timeString: string, upper?: boolean): number => {
  // Handle 12-hour format (h:mm a)
  if (timeString.includes('a') || timeString.includes('p') || timeString.includes('A') || timeString.includes('P')) {
    const cleanTime = timeString.replace(/\xa0/g, ' ').trim();
    const isPM = cleanTime.toLowerCase().includes('p');
    const timeOnly = cleanTime.replace(/[ap]m?/gi, '').trim();
    const [hours, minutes] = timeOnly.split(':').map(Number);
    
    let adjustedHours = hours;
    if (isPM && hours !== 12) {
      adjustedHours += 12;
    } else if (!isPM && hours === 12) {
      adjustedHours = 0;
    }
    
    return toUpperBound(adjustedHours, 24, upper) * 60 + minutes;
  }
  
  // Handle 24-hour format (HH:mm)
  const [hours, minutes] = timeString.split(':').map(Number);
  return toUpperBound(hours, 24, upper) * 60 + minutes;
};

// Helper function to format minutes to HH:mm format
const formatToDataFormat = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper function to format minutes to h:mm a format
const formatToTimeFormat = (totalMinutes: number): string => {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  let hours12 = hours24;
  let period = 'am';
  
  if (hours24 === 0) {
    hours12 = 12;
  } else if (hours24 === 12) {
    hours12 = 12;
    period = 'pm';
  } else if (hours24 > 12) {
    hours12 = hours24 - 12;
    period = 'pm';
  }
  
  return `${hours12}:${minutes.toString().padStart(2, '0')}\xa0${period}`;
};

// Convert time string to minutes for default values
const START_TIME_DEFAULT = parseTimeToMinutes(Validate.StartTime.options?.default as string);
const END_TIME_DEFAULT = parseTimeToMinutes(Validate.EndTime.options?.default as string);

interface ISchedule {
  id?: number;
  label?: string;
  startTime: string;
  endTime: string;
  occupied?: boolean;
  _count?: Record<string, number>;
}

type Required = "startTime" | "endTime";

const toDataFormat = (value: number) => formatToDataFormat(value);

const toTimeFormat = (value: number) => formatToTimeFormat(value);

const toUpperBound = (value: number, boundary: number, upper?: boolean) => (upper && value === 0 ? boundary : value);

const toMinutes = (value?: string, upper?: boolean) => {
  if (!value) return 0;
  return parseTimeStringToMinutes(value, upper);
};

const createScheduleLabel = (
  type: "all" | Required,
  schedule:
    | (DeepPartial<ISchedule> & Pick<ISchedule, Required>)
    | { occupied?: boolean; startTime: number; endTime: number },
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
