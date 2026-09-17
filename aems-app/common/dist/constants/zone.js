"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class Zone extends base_1.default {
    constructor() {
        super([
            {
                name: "exterior",
                label: "Exterior",
                type: "location",
            },
            {
                name: "interior",
                label: "Interior",
                type: "location",
            },
            {
                name: "high",
                label: "High",
                type: "mass",
            },
            {
                name: "medium",
                label: "Medium",
                type: "mass",
            },
            {
                name: "low",
                label: "Low",
                type: "mass",
            },
            {
                name: "north",
                label: "North",
                type: "orientation",
            },
            {
                name: "northeast",
                label: "Northeast",
                type: "orientation",
            },
            {
                name: "east",
                label: "East",
                type: "orientation",
            },
            {
                name: "southeast",
                label: "Southeast",
                type: "orientation",
            },
            {
                name: "south",
                label: "South",
                type: "orientation",
            },
            {
                name: "southwest",
                label: "Southwest",
                type: "orientation",
            },
            {
                name: "west",
                label: "West",
                type: "orientation",
            },
            {
                name: "northwest",
                label: "Northwest",
                type: "orientation",
            },
            {
                name: "senior-staff-office",
                label: "Senior Staff Office",
                previousName: "corner-office",
                previousLabel: "Corner Office",
                type: "building",
            },
            {
                name: "office",
                label: "Office",
                type: "building",
            },
            {
                name: "open-office",
                label: "Open Office",
                type: "building",
            },
            {
                name: "lobby",
                label: "Lobby",
                type: "building",
            },
            {
                name: "empty-office",
                label: "Empty Office",
                type: "building",
            },
            {
                name: "conference-room",
                label: "Conference Room",
                previousName: "conference",
                previousLabel: "Conference",
                type: "building",
            },
            {
                name: "mechanical-room",
                label: "Mechanical Room",
                type: "building",
            },
            {
                name: "computer-lab",
                label: "Computer Lab",
                type: "building",
            },
            {
                name: "kitchen",
                label: "Kitchen",
                type: "building",
            },
            {
                name: "mixed",
                label: "Mixed",
                type: "building",
            },
            {
                name: "closet-storage",
                label: "Closet/Storage",
                previousName: "closet",
                previousLabel: "Closet",
                type: "building",
            },
            {
                name: "other",
                label: "Other",
                type: "building",
            },
        ]);
        this.Location = Object.freeze({
            Exterior: Object.freeze(this.parseStrict("exterior")),
            Interior: Object.freeze(this.parseStrict("interior")),
        });
        this.LocationType = Object.freeze({
            ExteriorType: Object.freeze(this.parseStrict("exterior")),
            InteriorType: Object.freeze(this.parseStrict("interior")),
        });
        this.Mass = Object.freeze({
            High: Object.freeze(this.parseStrict("high")),
            Medium: Object.freeze(this.parseStrict("medium")),
            Low: Object.freeze(this.parseStrict("low")),
        });
        this.MassType = Object.freeze({
            HighType: Object.freeze(this.parseStrict("high")),
            MediumType: Object.freeze(this.parseStrict("medium")),
            LowType: Object.freeze(this.parseStrict("low")),
        });
        this.Orientation = Object.freeze({
            North: Object.freeze(this.parseStrict("north")),
            Northeast: Object.freeze(this.parseStrict("northeast")),
            East: Object.freeze(this.parseStrict("east")),
            Southeast: Object.freeze(this.parseStrict("southeast")),
            South: Object.freeze(this.parseStrict("south")),
            Southwest: Object.freeze(this.parseStrict("southwest")),
            West: Object.freeze(this.parseStrict("west")),
            Northwest: Object.freeze(this.parseStrict("northwest")),
        });
        this.OrientationType = Object.freeze({
            NorthType: Object.freeze(this.parseStrict("north")),
            NortheastType: Object.freeze(this.parseStrict("northeast")),
            EastType: Object.freeze(this.parseStrict("east")),
            SoutheastType: Object.freeze(this.parseStrict("southeast")),
            SouthType: Object.freeze(this.parseStrict("south")),
            SouthwestType: Object.freeze(this.parseStrict("southwest")),
            WestType: Object.freeze(this.parseStrict("west")),
            NorthwestType: Object.freeze(this.parseStrict("northwest")),
        });
        this.Building = Object.freeze({
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
        this.BuildingType = Object.freeze({
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
}
const zone = new Zone();
exports.default = zone;
//# sourceMappingURL=zone.js.map