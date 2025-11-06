import { IBase, IConstant } from ".";
import Base from "./base";
export type ZoneType = "location" | "mass" | "orientation" | "building";
export interface IZone extends IConstant {
    type: ZoneType;
}
declare class Zone extends Base<IZone> implements IBase<IZone> {
    constructor();
    Location: Readonly<{
        Exterior: Readonly<IZone>;
        Interior: Readonly<IZone>;
    }>;
    LocationType: Readonly<{
        ExteriorType: Readonly<IZone>;
        InteriorType: Readonly<IZone>;
    }>;
    Mass: Readonly<{
        High: Readonly<IZone>;
        Medium: Readonly<IZone>;
        Low: Readonly<IZone>;
    }>;
    MassType: Readonly<{
        HighType: Readonly<IZone>;
        MediumType: Readonly<IZone>;
        LowType: Readonly<IZone>;
    }>;
    Orientation: Readonly<{
        North: Readonly<IZone>;
        Northeast: Readonly<IZone>;
        East: Readonly<IZone>;
        Southeast: Readonly<IZone>;
        South: Readonly<IZone>;
        Southwest: Readonly<IZone>;
        West: Readonly<IZone>;
        Northwest: Readonly<IZone>;
    }>;
    OrientationType: Readonly<{
        NorthType: Readonly<IZone>;
        NortheastType: Readonly<IZone>;
        EastType: Readonly<IZone>;
        SoutheastType: Readonly<IZone>;
        SouthType: Readonly<IZone>;
        SouthwestType: Readonly<IZone>;
        WestType: Readonly<IZone>;
        NorthwestType: Readonly<IZone>;
    }>;
    Building: Readonly<{
        CornerOffice: Readonly<IZone>;
        Conference: Readonly<IZone>;
        Kitchen: Readonly<IZone>;
        Closet: Readonly<IZone>;
        Office: Readonly<IZone>;
        EmptyOffice: Readonly<IZone>;
        MechanicalRoom: Readonly<IZone>;
        ComputerLab: Readonly<IZone>;
        Mixed: Readonly<IZone>;
        Other: Readonly<IZone>;
    }>;
    BuildingType: Readonly<{
        CornerOfficeType: Readonly<IZone>;
        ConferenceType: Readonly<IZone>;
        KitchenType: Readonly<IZone>;
        ClosetType: Readonly<IZone>;
        OfficeType: Readonly<IZone>;
        EmptyOfficeType: Readonly<IZone>;
        MechanicalRoomType: Readonly<IZone>;
        ComputerLabType: Readonly<IZone>;
        MixedType: Readonly<IZone>;
        OtherType: Readonly<IZone>;
    }>;
}
declare const zone: Zone;
export default zone;
