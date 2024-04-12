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
  NewYearsDayType = this.parseStrict("new-years-day");
  MartinLutherKingJrType = this.parseStrict("martin-luther-king-jr");
  PresidentsDayType = this.parseStrict("presidents-day");
  MemorialDayType = this.parseStrict("memorial-day");
  JuneteenthType = this.parseStrict("juneteenth");
  IndependenceDayType = this.parseStrict("independence-day");
  LaborDayType = this.parseStrict("labor-day");
  ColumbusDayType = this.parseStrict("columbus-day");
  VeteransDayType = this.parseStrict("veterans-day");
  ThanksgivingType = this.parseStrict("thanksgiving");
  BlackFridayType = this.parseStrict("black-friday");
  ChristmasEveType = this.parseStrict("christmas-eve");
  ChristmasType = this.parseStrict("christmas");
}

const holiday = new Holiday();

export default holiday;
