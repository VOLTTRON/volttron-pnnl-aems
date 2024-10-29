import { IBase, IConstant } from "../types";
import Base from "./base";

class Observance extends Base<IConstant> implements IBase<IConstant> {
  constructor() {
    super([
      {
        name: "after_nearest_workday",
        label: "After Nearest Workday",
      },
      {
        name: "before_nearest_workday",
        label: "Before Nearest Workday",
      },
      {
        name: "nearest_workday",
        label: "Nearest Workday",
      },
      {
        name: "next_monday",
        label: "Next Monday",
      },
      {
        name: "next_workday",
        label: "Next Workday",
      },
      {
        name: "previous_workday",
        label: "Previous Workday",
      },
      {
        name: "previous_friday",
        label: "Previous Friday",
      },
      {
        name: "sunday_to_monday",
        label: "Sunday to Monday",
      },
    ])
  };

  // static references to objects
  AfterNearestWorkdayType = this.parseStrict("after_nearest_workday");
  BeforeNearestWorkdayType = this.parseStrict("before_nearest_workday");
  NearestWorkdayType = this.parseStrict("nearest_workday");
  NextMondayType = this.parseStrict("next_monday");
  NextWorkdayType = this.parseStrict("next_workday");
  PreviousWorkdayType = this.parseStrict("previous_workday");
  PreviousFridayType = this.parseStrict("previous_friday");
  SundayToMondayType = this.parseStrict("sunday_to_monday");
}

const observance = new Observance();

export default observance;
