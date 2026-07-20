"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const base_1 = require("./base");
const util_1 = require("../utils/util");
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
            {
                name: "keycloak",
                label: "Keycloak",
                grants: ["admin", "user"],
                enum: _1.RoleEnum.Keycloak,
            },
        ].map((r) => ({
            ...r,
            granted: ((_v) => {
                throw new Error("Role granted function not implemented.");
            }),
        })), (t, r) => (0, util_1.deepMerge)(r, { granted: ((...v) => t.granted(r, ...v)) }));
        this.Super = this.parseStrict("super");
        this.SuperType = this.parseStrict("super");
        this.Admin = this.parseStrict("admin");
        this.AdminType = this.parseStrict("admin");
        this.User = this.parseStrict("user");
        this.UserType = this.parseStrict("user");
        this.Keycloak = this.parseStrict("keycloak");
        this.KeycloakType = this.parseStrict("keycloak");
        this.granted = (a, ...b) => {
            const name = this.parse(a)?.name;
            const roles = b.map((v) => this.parse(v)?.name).filter((v) => v);
            const granted = this.values.filter((v) => v.name === name || v.grants.includes(name ?? "")).map((v) => v.name);
            return roles.some(r => granted.includes(r));
        };
    }
}
const role = new Role();
exports.default = role;
//# sourceMappingURL=role.js.map