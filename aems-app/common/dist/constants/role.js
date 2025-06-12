"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const _1 = require(".");
const base_1 = require("./base");
class Role extends base_1.default {
    constructor() {
        super([
            {
                name: "super",
                label: "Super",
                grants: [],
                enum: _1.RoleEnum.Super,
            },
            {
                name: "admin",
                label: "Admin",
                grants: ["user"],
                enum: _1.RoleEnum.Admin,
            },
            {
                name: "user",
                label: "User",
                grants: [],
                enum: _1.RoleEnum.User,
            },
        ].map((r) => ({
            ...r,
            granted: ((_v) => {
                throw new Error("Role granted function not implemented.");
            }),
        })), (t, r) => (0, lodash_1.merge)(r, { granted: ((...v) => t.granted(r, ...v)) }));
        this.Super = this.parseStrict("super");
        this.SuperType = this.parseStrict("super");
        this.Admin = this.parseStrict("admin");
        this.AdminType = this.parseStrict("admin");
        this.User = this.parseStrict("user");
        this.UserType = this.parseStrict("user");
        this.granted = (a, ...b) => {
            const name = this.parse(a)?.name;
            const roles = b.map((v) => this.parse(v)?.name).filter((v) => v);
            const granted = this.values.filter((v) => v.name === name || v.grants.includes(name ?? "")).map((v) => v.name);
            return (0, lodash_1.intersection)(roles, granted).length > 0;
        };
    }
}
const role = new Role();
exports.default = role;
//# sourceMappingURL=role.js.map