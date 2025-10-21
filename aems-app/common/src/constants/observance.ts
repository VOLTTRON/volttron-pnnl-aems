import { IBase, IConstant } from ".";
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
    ]);
  }

  // static references to objects
  AfterNearestWorkday = this.parseStrict("after_nearest_workday");
  AfterNearestWorkdayType = this.parseStrict("after_nearest_workday");
  BeforeNearestWorkday = this.parseStrict("before_nearest_workday");
  BeforeNearestWorkdayType = this.parseStrict("before_nearest_workday");
  NearestWorkday = this.parseStrict("nearest_workday");
  NearestWorkdayType = this.parseStrict("nearest_workday");
  NextMonday = this.parseStrict("next_monday");
  NextMondayType = this.parseStrict("next_monday");
  NextWorkday = this.parseStrict("next_workday");
  NextWorkdayType = this.parseStrict("next_workday");
  PreviousWorkday = this.parseStrict("previous_workday");
  PreviousWorkdayType = this.parseStrict("previous_workday");
  PreviousFriday = this.parseStrict("previous_friday");
  PreviousFridayType = this.parseStrict("previous_friday");
  SundayToMonday = this.parseStrict("sunday_to_monday");
  SundayToMondayType = this.parseStrict("sunday_to_monday");
}

const observance = new Observance();

export default observance;
