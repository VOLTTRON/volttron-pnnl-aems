import { ModelStage } from "@prisma/client";
import { IBase, IEnum } from ".";
import Base from "./base";

export interface IStage extends IEnum<ModelStage> {
  past: string;
  present: string;
}

class Stage extends Base<IStage> implements IBase<IStage> {
  constructor() {
    super([
      {
        name: "create",
        label: "Create",
        enum: ModelStage.Create,
        past: "Created",
        present: "Creating",
      },
      {
        name: "read",
        label: "Read",
        enum: ModelStage.Read,
        past: "Read",
        present: "Reading",
      },
      {
        name: "update",
        label: "Update",
        enum: ModelStage.Update,
        past: "Updated",
        present: "Updating",
      },
      {
        name: "delete",
        label: "Delete",
        enum: ModelStage.Delete,
        past: "Deleted",
        present: "Deleting",
      },
      {
        name: "process",
        label: "Process",
        enum: ModelStage.Process,
        past: "Processed",
        present: "Processing",
      },
      {
        name: "complete",
        label: "Complete",
        enum: ModelStage.Complete,
        past: "Completed",
        present: "Completing",
      },
      {
        name: "fail",
        label: "Fail",
        enum: ModelStage.Fail,
        past: "Failed",
        present: "Failing",
      },
    ]);
  }

  // static references to objects
  Create = this.parseStrict("create");
  CreateType = this.parseStrict("create");
  Read = this.parseStrict("read");
  ReadType = this.parseStrict("read");
  Update = this.parseStrict("update");
  UpdateType = this.parseStrict("update");
  Delete = this.parseStrict("delete");
  DeleteType = this.parseStrict("delete");
  Process = this.parseStrict("process");
  ProcessType = this.parseStrict("process");
  Complete = this.parseStrict("complete");
  CompleteType = this.parseStrict("complete");
  Fail = this.parseStrict("fail");
  FailType = this.parseStrict("fail");
}

const stage = new Stage();

export default stage;
