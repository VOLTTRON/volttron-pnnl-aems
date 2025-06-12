import { enum_feedbackStatus } from "@prisma/client";

import { IEnum } from "../types";
import Base from "./base";

class FeedbackStatus extends Base<IEnum<enum_feedbackStatus>> {
  constructor() {
    super([
      {
        name: "to-do",
        label: "To-do",
        enum: "Todo",
      },
      {
        name: "in-progress",
        label: "In progress",
        enum: "InProgress",
      },
      {
        name: "done",
        label: "Done",
        enum: "Done",
      }
    ])
  }

  // static references to objects
  Todo = this.parseStrict("to-do");
  TodoType = this.parseStrict("to-do");
  InProgress = this.parseStrict("in-progress");
  InProgressType = this.parseStrict("in-progress");
  Done = this.parseStrict("done");
  DoneType = this.parseStrict("done");
}

const feedbackStatus = new FeedbackStatus();

export default feedbackStatus;
