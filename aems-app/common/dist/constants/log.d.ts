import { ILog } from ".";
import Base from "./base";
declare class Log extends Base<ILog> {
    constructor();
    Trace: ILog;
    TraceType: ILog;
    Debug: ILog;
    DebugType: ILog;
    Info: ILog;
    InfoType: ILog;
    Warn: ILog;
    WarnType: ILog;
    Error: ILog;
    ErrorType: ILog;
    Fatal: ILog;
    FatalType: ILog;
}
declare const log: Log;
export default log;
