import { IFeedbackStatus } from ".";
import Base from "./base";
declare class FeedbackStatus extends Base<IFeedbackStatus> {
    constructor();
    Todo: IFeedbackStatus;
    TodoType: IFeedbackStatus;
    InProgress: IFeedbackStatus;
    InProgressType: IFeedbackStatus;
    Done: IFeedbackStatus;
    DoneType: IFeedbackStatus;
}
declare const feedbackStatus: FeedbackStatus;
export default feedbackStatus;
