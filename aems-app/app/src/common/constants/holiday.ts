import { IBase, IConstant } from "../types";
import Base from "./base";

class Holiday extends Base<IConstant> implements IBase<IConstant> {
  constructor() {
    super([
      {
        name: "new-years-day",
        label: "New Year's Day",
      },
      {
        name: "martin-luther-king-jr",
        label: "Martin Luther King Jr",
      },
      {
        name: "presidents-day",
        label: "Presidents Day",
      },
      {
        name: "memorial-day",
        label: "Memorial Day",
      },
      {
        name: "juneteenth",
        label: "Juneteenth",
      },
      {
        name: "independence-day",
        label: "Independence Day",
      },
      {
        name: "labor-day",
        label: "Labor Day",
      },
      {
        name: "columbus-day",
        label: "Columbus Day",
      },
      {
        name: "veterans-day",
        label: "Veterans Day",
      },
      {
        name: "thanksgiving",
        label: "Thanksgiving",
      },
      {
        name: "black-friday",
        label: "Black Friday",
      },
      {
        name: "christmas-eve",
        label: "Christmas Eve",
      },
      {
        name: "christmas",
        label: "Christmas",
      },
    ]);
  }

  // static references to objects
  NewYearsDay = this.parseStrict("new-years-day");
  NewYearsDayType = this.parseStrict("new-years-day");
  MartinLutherKingJr = this.parseStrict("martin-luther-king-jr");
  MartinLutherKingJrType = this.parseStrict("martin-luther-king-jr");
  PresidentsDay = this.parseStrict("presidents-day");
  PresidentsDayType = this.parseStrict("presidents-day");
  MemorialDay = this.parseStrict("memorial-day");
  MemorialDayType = this.parseStrict("memorial-day");
  Juneteenth = this.parseStrict("juneteenth");
  JuneteenthType = this.parseStrict("juneteenth");
  IndependenceDay = this.parseStrict("independence-day");
  IndependenceDayType = this.parseStrict("independence-day");
  LaborDay = this.parseStrict("labor-day");
  LaborDayType = this.parseStrict("labor-day");
  ColumbusDay = this.parseStrict("columbus-day");
  ColumbusDayType = this.parseStrict("columbus-day");
  VeteransDay = this.parseStrict("veterans-day");
  VeteransDayType = this.parseStrict("veterans-day");
  Thanksgiving = this.parseStrict("thanksgiving");
  ThanksgivingType = this.parseStrict("thanksgiving");
  BlackFriday = this.parseStrict("black-friday");
  BlackFridayType = this.parseStrict("black-friday");
  ChristmasEve = this.parseStrict("christmas-eve");
  ChristmasEveType = this.parseStrict("christmas-eve");
  Christmas = this.parseStrict("christmas");
  ChristmasType = this.parseStrict("christmas");
}

const holiday = new Holiday();

export default holiday;
