import { IBase, IConstant } from ".";
import Base from "./base";

export type ZoneType = "location" | "mass" | "orientation" | "building";

export interface IZone extends IConstant {
  type: ZoneType;
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
        name: "corner-office",
        label: "Corner Office",
        type: "building" as ZoneType,
      },
      {
        name: "conference",
        label: "Conference",
        type: "building" as ZoneType,
      },
      {
        name: "kitchen",
        label: "Kitchen",
        type: "building" as ZoneType,
      },
      {
        name: "closet",
        label: "Closet",
        type: "building" as ZoneType,
      },
      {
        name: "office",
        label: "Office",
        type: "building" as ZoneType,
      },
      {
        name: "empty-office",
        label: "Empty Office",
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
        name: "mixed",
        label: "Mixed",
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
    CornerOffice: Object.freeze(this.parseStrict("corner-office")),
    Conference: Object.freeze(this.parseStrict("conference")),
    Kitchen: Object.freeze(this.parseStrict("kitchen")),
    Closet: Object.freeze(this.parseStrict("closet")),
    Office: Object.freeze(this.parseStrict("office")),
    EmptyOffice: Object.freeze(this.parseStrict("empty-office")),
    MechanicalRoom: Object.freeze(this.parseStrict("mechanical-room")),
    ComputerLab: Object.freeze(this.parseStrict("computer-lab")),
    Mixed: Object.freeze(this.parseStrict("mixed")),
    Other: Object.freeze(this.parseStrict("other")),
  });
  BuildingType = Object.freeze({
    CornerOfficeType: Object.freeze(this.parseStrict("corner-office")),
    ConferenceType: Object.freeze(this.parseStrict("conference")),
    KitchenType: Object.freeze(this.parseStrict("kitchen")),
    ClosetType: Object.freeze(this.parseStrict("closet")),
    OfficeType: Object.freeze(this.parseStrict("office")),
    EmptyOfficeType: Object.freeze(this.parseStrict("empty-office")),
    MechanicalRoomType: Object.freeze(this.parseStrict("mechanical-room")),
    ComputerLabType: Object.freeze(this.parseStrict("computer-lab")),
    MixedType: Object.freeze(this.parseStrict("mixed")),
    OtherType: Object.freeze(this.parseStrict("other")),
  });
}

const zone = new Zone();

export default zone;
