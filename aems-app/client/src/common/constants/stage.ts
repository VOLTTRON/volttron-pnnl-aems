import { IBase, IStage, Stage_type } from "../types";
import Base from "./base";


class Stage extends Base<IStage> implements IBase<IStage> {
  constructor() {
    super([
      {
        name: "create",
        label: "Create",
        enum: Stage_type.Create,
        past: "Created",
        present: "Creating",
      },
      {
        name: "read",
        label: "Read",
        enum: Stage_type.Read,
        past: "Read",
        present: "Reading",
      },
      {
        name: "update",
        label: "Update",
        enum: Stage_type.Update,
        past: "Updated",
        present: "Updating",
      },
      {
        name: "delete",
        label: "Delete",
        enum: Stage_type.Delete,
        past: "Deleted",
        present: "Deleting",
      },
      {
        name: "process",
        label: "Process",
        enum: Stage_type.Process,
        past: "Processed",
        present: "Processing",
      },
      {
        name: "complete",
        label: "Complete",
        enum: Stage_type.Complete,
        past: "Completed",
        present: "Completing",
      },
      {
        name: "fail",
        label: "Fail",
        enum: Stage_type.Fail,
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
