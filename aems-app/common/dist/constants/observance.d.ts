import { IBase, IConstant } from ".";
import Base from "./base";
declare class Observance extends Base<IConstant> implements IBase<IConstant> {
    constructor();
    AfterNearestWorkday: IConstant;
    AfterNearestWorkdayType: IConstant;
    BeforeNearestWorkday: IConstant;
    BeforeNearestWorkdayType: IConstant;
    NearestWorkday: IConstant;
    NearestWorkdayType: IConstant;
    NextMonday: IConstant;
    NextMondayType: IConstant;
    NextWorkday: IConstant;
    NextWorkdayType: IConstant;
    PreviousWorkday: IConstant;
    PreviousWorkdayType: IConstant;
    PreviousFriday: IConstant;
    PreviousFridayType: IConstant;
    SundayToMonday: IConstant;
    SundayToMondayType: IConstant;
}
declare const observance: Observance;
export default observance;
