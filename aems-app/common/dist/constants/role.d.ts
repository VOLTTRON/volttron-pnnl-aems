import { IBase, IRole } from ".";
import Base from "./base";
declare class Role extends Base<IRole> implements IBase<IRole> {
    constructor();
    Super: IRole;
    SuperType: IRole;
    Admin: IRole;
    AdminType: IRole;
    User: IRole;
    UserType: IRole;
    granted: (a: IRole | number | string, ...b: (IRole | number | string)[]) => boolean;
}
declare const role: Role;
export default role;
