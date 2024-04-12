import { IBase, IZone, ZoneType } from "../types";
import Base from "./base";

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
    ])
  };

  // static references to objects
  LocationType = Object.freeze({
    ExteriorType: Object.freeze(this.parseStrict("exterior")),
    InteriorType: Object.freeze(this.parseStrict("interior")),
  });
  MassType = Object.freeze({
    HighType: Object.freeze(this.parseStrict("high")),
    MediumType: Object.freeze(this.parseStrict("medium")),
    LowType: Object.freeze(this.parseStrict("low")),
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
