import { ModelStage } from "@prisma/client";
import { IBase, IEnum } from ".";
import Base from "./base";
export interface IStage extends IEnum<ModelStage> {
    past: string;
    present: string;
}
declare class Stage extends Base<IStage> implements IBase<IStage> {
    constructor();
    Create: IStage;
    CreateType: IStage;
    Read: IStage;
    ReadType: IStage;
    Update: IStage;
    UpdateType: IStage;
    Delete: IStage;
    DeleteType: IStage;
    Process: IStage;
    ProcessType: IStage;
    Complete: IStage;
    CompleteType: IStage;
    Fail: IStage;
    FailType: IStage;
}
declare const stage: Stage;
export default stage;
