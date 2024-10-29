import { enum_stage } from "@prisma/client";

import { IBase, IEnum } from "../types";
import Base from "./base";

export interface IStage extends IEnum<enum_stage> {
  past: string;
  present: string;
}

class Stage extends Base<IStage> implements IBase<IStage> {
  constructor() {
    super([
      {
        name: "create",
        label: "Create",
        enum: "Create" as enum_stage,
        past: "Created",
        present: "Creating",
      },
      {
        name: "read",
        label: "Read",
        enum: "Read" as enum_stage,
        past: "Read",
        present: "Reading",
      },
      {
        name: "update",
        label: "Update",
        enum: "Update" as enum_stage,
        past: "Updated",
        present: "Updating",
      },
      {
        name: "delete",
        label: "Delete",
        enum: "Delete" as enum_stage,
        past: "Deleted",
        present: "Deleting",
      },
      {
        name: "process",
        label: "Process",
        enum: "Process" as enum_stage,
        past: "Processed",
        present: "Processing",
      },
      {
        name: "complete",
        label: "Complete",
        enum: "Complete" as enum_stage,
        past: "Completed",
        present: "Completing",
      },
      {
        name: "fail",
        label: "Fail",
        enum: "Fail" as enum_stage,
        past: "Failed",
        present: "Failing",
      },
    ]);
  }

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
