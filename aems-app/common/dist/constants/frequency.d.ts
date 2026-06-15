import { IBase, IFrequency } from ".";
import Base from "./base";
declare class Frequency extends Base<IFrequency> implements IBase<IFrequency> {
    constructor();
    Millisecond: IFrequency;
    MillisecondType: IFrequency;
    Second: IFrequency;
    SecondType: IFrequency;
    Minute: IFrequency;
    MinuteType: IFrequency;
    Hour: IFrequency;
    HourType: IFrequency;
    Day: IFrequency;
    DayType: IFrequency;
    Week: IFrequency;
    WeekType: IFrequency;
    Month: IFrequency;
    MonthType: IFrequency;
    Year: IFrequency;
    YearType: IFrequency;
    static convert(from: IFrequency | number | string, value: number, to: IFrequency | number | string): number;
    convert(from: IFrequency | number | string, value: number, to: IFrequency | number | string): number;
}
declare const frequency: Frequency;
export default frequency;
