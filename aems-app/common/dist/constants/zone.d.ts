import { IBase, IConstant } from ".";
import Base from "./base";
export type ZoneType = "location" | "mass" | "orientation" | "building";
export interface IZone extends IConstant {
    type: ZoneType;
    previousName?: string;
    previousLabel?: string;
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
        SeniorStaffOffice: Readonly<IZone>;
        Office: Readonly<IZone>;
        OpenOffice: Readonly<IZone>;
        Lobby: Readonly<IZone>;
        EmptyOffice: Readonly<IZone>;
        ConferenceRoom: Readonly<IZone>;
        MechanicalRoom: Readonly<IZone>;
        ComputerLab: Readonly<IZone>;
        Kitchen: Readonly<IZone>;
        Mixed: Readonly<IZone>;
        ClosetStorage: Readonly<IZone>;
        Other: Readonly<IZone>;
    }>;
    BuildingType: Readonly<{
        SeniorStaffOfficeType: Readonly<IZone>;
        OfficeType: Readonly<IZone>;
        OpenOfficeType: Readonly<IZone>;
        LobbyType: Readonly<IZone>;
        EmptyOfficeType: Readonly<IZone>;
        ConferenceRoomType: Readonly<IZone>;
        MechanicalRoomType: Readonly<IZone>;
        ComputerLabType: Readonly<IZone>;
        KitchenType: Readonly<IZone>;
        MixedType: Readonly<IZone>;
        ClosetStorageType: Readonly<IZone>;
        OtherType: Readonly<IZone>;
    }>;
}
declare const zone: Zone;
export default zone;
