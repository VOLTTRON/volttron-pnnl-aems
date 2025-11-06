import { IFeedbackStatus } from ".";
import Base from "./base";

class FeedbackStatus extends Base<IFeedbackStatus> {
  constructor() {
    super([
      {
        name: "to-do",
        label: "To-do",
        enum: "Todo" as const,
      },
      {
        name: "in-progress",
        label: "In progress",
        enum: "InProgress" as const,
      },
      {
        name: "done",
        label: "Done",
        enum: "Done" as const,
      },
    ]);
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
