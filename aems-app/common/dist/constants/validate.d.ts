import { IBase, IConstant } from ".";
import Base from "./base";
export type ValidateType = "unit" | "schedule" | "setpoint";
export interface IValidate extends IConstant {
    type: ValidateType;
    options?: {
        default: string;
        min?: string;
        max?: string;
    } | {
        default: boolean;
        min?: undefined;
        max?: undefined;
    } | {
        default: number;
        min: number;
        max: number;
    };
}
declare class Validate extends Base<IValidate> implements IBase<IValidate> {
    constructor();
    Setpoint: IValidate;
    SetpointType: IValidate;
    Deadband: IValidate;
    DeadbandType: IValidate;
    Heating: IValidate;
    HeatingType: IValidate;
    Cooling: IValidate;
    CoolingType: IValidate;
    StartTime: IValidate;
    StartTimeType: IValidate;
    EndTime: IValidate;
    EndTimeType: IValidate;
    Occupied: IValidate;
    OccupiedType: IValidate;
    CoolingCapacity: IValidate;
    CoolingCapacityType: IValidate;
    Compressors: IValidate;
    CompressorsType: IValidate;
    CoolingLockout: IValidate;
    CoolingLockoutType: IValidate;
    OptimalStartLockout: IValidate;
    OptimalStartLockoutType: IValidate;
    OptimalStartDeviation: IValidate;
    OptimalStartDeviationType: IValidate;
    EarliestStart: IValidate;
    EarliestStartType: IValidate;
    LatestStart: IValidate;
    LatestStartType: IValidate;
    ZoneLocation: IValidate;
    ZoneLocationType: IValidate;
    ZoneMass: IValidate;
    ZoneMassType: IValidate;
    ZoneOrientation: IValidate;
    ZoneOrientationType: IValidate;
    ZoneBuilding: IValidate;
    ZoneBuildingType: IValidate;
    HeatPump: IValidate;
    HeatPumpType: IValidate;
    HeatPumpBackup: IValidate;
    HeatPumpBackupType: IValidate;
    Economizer: IValidate;
    EconomizerType: IValidate;
    HeatPumpLockout: IValidate;
    HeatPumpLockoutType: IValidate;
    CoolingPeakOffset: IValidate;
    CoolingPeakOffsetType: IValidate;
    HeatingPeakOffset: IValidate;
    HeatingPeakOffsetType: IValidate;
    PeakLoadExclude: IValidate;
    PeakLoadExcludeType: IValidate;
    EconomizerSetpoint: IValidate;
    EconomizerSetpointType: IValidate;
}
declare const validate: Validate;
export default validate;
