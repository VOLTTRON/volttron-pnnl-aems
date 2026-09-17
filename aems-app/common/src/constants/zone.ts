import { IBase, IConstant } from ".";
import Base from "./base";

export type ZoneType = "location" | "mass" | "orientation" | "building";

export interface IZone extends IConstant {
  type: ZoneType;
  previousName?: string;
  previousLabel?: string;
}

class Zone extends Base<IZone> implements IBase<IZone> {
  constructor() {
    super([
      {
        name: "exterior",
        label: "Exterior",
        type: "location" as ZoneType,
      },
      {
        name: "interior",
        label: "Interior",
        type: "location" as ZoneType,
      },
      {
        name: "high",
        label: "High",
        type: "mass" as ZoneType,
      },
      {
        name: "medium",
        label: "Medium",
        type: "mass" as ZoneType,
      },
      {
        name: "low",
        label: "Low",
        type: "mass" as ZoneType,
      },
      {
        name: "north",
        label: "North",
        type: "orientation" as ZoneType,
      },
      {
        name: "northeast",
        label: "Northeast",
        type: "orientation" as ZoneType,
      },
      {
        name: "east",
        label: "East",
        type: "orientation" as ZoneType,
      },
      {
        name: "southeast",
        label: "Southeast",
        type: "orientation" as ZoneType,
      },
      {
        name: "south",
        label: "South",
        type: "orientation" as ZoneType,
      },
      {
        name: "southwest",
        label: "Southwest",
        type: "orientation" as ZoneType,
      },
      {
        name: "west",
        label: "West",
        type: "orientation" as ZoneType,
      },
      {
        name: "northwest",
        label: "Northwest",
        type: "orientation" as ZoneType,
      },
      {
        name: "senior-staff-office",
        label: "Senior Staff Office",
        previousName: "corner-office",
        previousLabel: "Corner Office",
        type: "building" as ZoneType,
      },
      {
        name: "office",
        label: "Office",
        type: "building" as ZoneType,
      },
      {
        name: "open-office",
        label: "Open Office",
        type: "building" as ZoneType,
      },
      {
        name: "lobby",
        label: "Lobby",
        type: "building" as ZoneType,
      },
      {
        name: "empty-office",
        label: "Empty Office",
        type: "building" as ZoneType,
      },
      {
        name: "conference-room",
        label: "Conference Room",
        previousName: "conference",
        previousLabel: "Conference",
        type: "building" as ZoneType,
      },
      {
        name: "mechanical-room",
        label: "Mechanical Room",
        type: "building" as ZoneType,
      },
      {
        name: "computer-lab",
        label: "Computer Lab",
        type: "building" as ZoneType,
      },
      {
        name: "kitchen",
        label: "Kitchen",
        type: "building" as ZoneType,
      },
      {
        name: "mixed",
        label: "Mixed",
        type: "building" as ZoneType,
      },
      {
        name: "closet-storage",
        label: "Closet/Storage",
        previousName: "closet",
        previousLabel: "Closet",
        type: "building" as ZoneType,
      },
      {
        name: "other",
        label: "Other",
        type: "building" as ZoneType,
      },
    ]);
  }

  // static references to objects
  Location = Object.freeze({
    Exterior: Object.freeze(this.parseStrict("exterior")),
    Interior: Object.freeze(this.parseStrict("interior")),
  });
  LocationType = Object.freeze({
    ExteriorType: Object.freeze(this.parseStrict("exterior")),
    InteriorType: Object.freeze(this.parseStrict("interior")),
  });
  Mass = Object.freeze({
    High: Object.freeze(this.parseStrict("high")),
    Medium: Object.freeze(this.parseStrict("medium")),
    Low: Object.freeze(this.parseStrict("low")),
  });
  MassType = Object.freeze({
    HighType: Object.freeze(this.parseStrict("high")),
    MediumType: Object.freeze(this.parseStrict("medium")),
    LowType: Object.freeze(this.parseStrict("low")),
  });
  Orientation = Object.freeze({
    North: Object.freeze(this.parseStrict("north")),
    Northeast: Object.freeze(this.parseStrict("northeast")),
    East: Object.freeze(this.parseStrict("east")),
    Southeast: Object.freeze(this.parseStrict("southeast")),
    South: Object.freeze(this.parseStrict("south")),
    Southwest: Object.freeze(this.parseStrict("southwest")),
    West: Object.freeze(this.parseStrict("west")),
    Northwest: Object.freeze(this.parseStrict("northwest")),
  });
  OrientationType = Object.freeze({
    NorthType: Object.freeze(this.parseStrict("north")),
    NortheastType: Object.freeze(this.parseStrict("northeast")),
    EastType: Object.freeze(this.parseStrict("east")),
    SoutheastType: Object.freeze(this.parseStrict("southeast")),
    SouthType: Object.freeze(this.parseStrict("south")),
    SouthwestType: Object.freeze(this.parseStrict("southwest")),
    WestType: Object.freeze(this.parseStrict("west")),
    NorthwestType: Object.freeze(this.parseStrict("northwest")),
  });
  Building = Object.freeze({
    SeniorStaffOffice: Object.freeze(this.parseStrict("senior-staff-office")),
    Office: Object.freeze(this.parseStrict("office")),
    OpenOffice: Object.freeze(this.parseStrict("open-office")),
    Lobby: Object.freeze(this.parseStrict("lobby")),
    EmptyOffice: Object.freeze(this.parseStrict("empty-office")),
    ConferenceRoom: Object.freeze(this.parseStrict("conference-room")),
    MechanicalRoom: Object.freeze(this.parseStrict("mechanical-room")),
    ComputerLab: Object.freeze(this.parseStrict("computer-lab")),
    Kitchen: Object.freeze(this.parseStrict("kitchen")),
    Mixed: Object.freeze(this.parseStrict("mixed")),
    ClosetStorage: Object.freeze(this.parseStrict("closet-storage")),
    Other: Object.freeze(this.parseStrict("other")),
  });
  BuildingType = Object.freeze({
    SeniorStaffOfficeType: Object.freeze(this.parseStrict("senior-staff-office")),
    OfficeType: Object.freeze(this.parseStrict("office")),
    OpenOfficeType: Object.freeze(this.parseStrict("open-office")),
    LobbyType: Object.freeze(this.parseStrict("lobby")),
    EmptyOfficeType: Object.freeze(this.parseStrict("empty-office")),
    ConferenceRoomType: Object.freeze(this.parseStrict("conference-room")),
    MechanicalRoomType: Object.freeze(this.parseStrict("mechanical-room")),
    ComputerLabType: Object.freeze(this.parseStrict("computer-lab")),
    KitchenType: Object.freeze(this.parseStrict("kitchen")),
    MixedType: Object.freeze(this.parseStrict("mixed")),
    ClosetStorageType: Object.freeze(this.parseStrict("closet-storage")),
    OtherType: Object.freeze(this.parseStrict("other")),
  });
}

const zone = new Zone();

export default zone;
