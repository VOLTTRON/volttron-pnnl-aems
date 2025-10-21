import { IBase, IFrequency } from ".";
import Base from "./base";
declare class Frequency extends Base<IFrequency> implements IBase<IFrequency> {
    constructor();
    Second: IFrequency;
    SecondType: IFrequency;
    Minute: IFrequency;
    MinuteType: IFrequency;
    Hour: IFrequency;
    HourType: IFrequency;
    Day: IFrequency;
    DayType: IFrequency;
}
declare const frequency: Frequency;
export default frequency;
