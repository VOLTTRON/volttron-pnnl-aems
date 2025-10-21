"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const base_1 = require("./base");
class Stage extends base_1.default {
    constructor() {
        super([
            {
                name: "create",
                label: "Create",
                enum: client_1.ModelStage.Create,
                past: "Created",
                present: "Creating",
            },
            {
                name: "read",
                label: "Read",
                enum: client_1.ModelStage.Read,
                past: "Read",
                present: "Reading",
            },
            {
                name: "update",
                label: "Update",
                enum: client_1.ModelStage.Update,
                past: "Updated",
                present: "Updating",
            },
            {
                name: "delete",
                label: "Delete",
                enum: client_1.ModelStage.Delete,
                past: "Deleted",
                present: "Deleting",
            },
            {
                name: "process",
                label: "Process",
                enum: client_1.ModelStage.Process,
                past: "Processed",
                present: "Processing",
            },
            {
                name: "complete",
                label: "Complete",
                enum: client_1.ModelStage.Complete,
                past: "Completed",
                present: "Completing",
            },
            {
                name: "fail",
                label: "Fail",
                enum: client_1.ModelStage.Fail,
                past: "Failed",
                present: "Failing",
            },
        ]);
        this.Create = this.parseStrict("create");
        this.CreateType = this.parseStrict("create");
        this.Read = this.parseStrict("read");
        this.ReadType = this.parseStrict("read");
        this.Update = this.parseStrict("update");
        this.UpdateType = this.parseStrict("update");
        this.Delete = this.parseStrict("delete");
        this.DeleteType = this.parseStrict("delete");
        this.Process = this.parseStrict("process");
        this.ProcessType = this.parseStrict("process");
        this.Complete = this.parseStrict("complete");
        this.CompleteType = this.parseStrict("complete");
        this.Fail = this.parseStrict("fail");
        this.FailType = this.parseStrict("fail");
    }
}
const stage = new Stage();
exports.default = stage;
//# sourceMappingURL=stage.js.map