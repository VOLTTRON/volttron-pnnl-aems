"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class FeedbackStatus extends base_1.default {
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
            },
        ]);
        this.Todo = this.parseStrict("to-do");
        this.TodoType = this.parseStrict("to-do");
        this.InProgress = this.parseStrict("in-progress");
        this.InProgressType = this.parseStrict("in-progress");
        this.Done = this.parseStrict("done");
        this.DoneType = this.parseStrict("done");
    }
}
const feedbackStatus = new FeedbackStatus();
exports.default = feedbackStatus;
//# sourceMappingURL=feedbackStatus.js.map