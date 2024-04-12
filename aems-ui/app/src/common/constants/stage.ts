import { Stage_type } from "@prisma/client";

import { IBase, IStage } from "../types";
import Base from "./base";

class Stage extends Base<IStage> implements IBase<IStage> {
  constructor() {
    super([
      {
        name: "create",
        label: "Create",
        enum: "Create" as Stage_type,
        past: "Created",
        present: "Creating",
      },
      {
        name: "read",
        label: "Read",
        enum: "Read" as Stage_type,
        past: "Read",
        present: "Reading",
      },
      {
        name: "update",
        label: "Update",
        enum: "Update" as Stage_type,
        past: "Updated",
        present: "Updating",
      },
      {
        name: "delete",
        label: "Delete",
        enum: "Delete" as Stage_type,
        past: "Deleted",
        present: "Deleting",
      },
      {
        name: "process",
        label: "Process",
        enum: "Process" as Stage_type,
        past: "Processed",
        present: "Processing",
      },
      {
        name: "complete",
        label: "Complete",
        enum: "Complete" as Stage_type,
        past: "Completed",
        present: "Completing",
      },
      {
        name: "fail",
        label: "Fail",
        enum: "Fail" as Stage_type,
        past: "Failed",
        present: "Failing",
      },
    ])};

  // static references to objects
  CreateType = this.parseStrict("create");
  ReadType = this.parseStrict("read");
  UpdateType = this.parseStrict("update");
  DeleteType = this.parseStrict("delete");
  ProcessType = this.parseStrict("process");
  CompleteType = this.parseStrict("complete");
  FailType = this.parseStrict("fail");
}

const stage = new Stage();

export default stage;
