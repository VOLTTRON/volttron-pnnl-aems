"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPassword = exports.AuthUser = void 0;
exports.buildExpressUser = buildExpressUser;
const common_1 = require("@local/common");
const core_1 = require("@zxcvbn-ts/core");
const core_2 = require("@zxcvbn-ts/core");
const zxcvbnCommonPackage = require("@zxcvbn-ts/language-common");
const zxcvbnEnPackage = require("@zxcvbn-ts/language-en");
const lodash_1 = require("lodash");
const authRoles = (role) => {
    const roles = role.split(/[, |]+/).map((r) => r.trim()).filter(Boolean);
    return common_1.RoleType.values.reduce((a, v) => {
        a[v.enum] = v.granted(...roles) ?? false;
        return a;
    }, {});
};
class AuthUser {
    constructor(...args) {
        if (typeof args[0] === "object") {
            const prismaUser = (0, common_1.typeofObject)(args[0], (v) => "role" in v) ? args[0] : undefined;
            const expressUser = (0, common_1.typeofObject)(args[0], (v) => "authRoles" in v) ? args[0] : undefined;
            this.id = prismaUser?.id ?? expressUser?.id;
            this.roles = expressUser?.authRoles ?? (prismaUser?.role ? authRoles(prismaUser.role) : authRoles(""));
        }
        else {
            this.id = args[0];
            this.roles = typeof args[1] === "string" ? authRoles(args[1]) : (args[1] ?? authRoles(""));
        }
    }
}
exports.AuthUser = AuthUser;
function buildExpressUser(user) {
    return (0, lodash_1.omit)({
        ...user,
        roles: (user.role?.split(",") ?? []).map((r) => common_1.RoleType.parse(r.trim())).filter((r) => (0, common_1.typeofObject)(r)),
        authRoles: authRoles(user.role ?? ""),
    }, "password");
}
const options = {
    dictionary: {
        ...zxcvbnCommonPackage.dictionary,
        ...zxcvbnEnPackage.dictionary,
    },
    graphs: zxcvbnCommonPackage.adjacencyGraphs,
    translations: zxcvbnEnPackage.translations,
};
core_2.zxcvbnOptions.setOptions(options);
const checkPassword = (password, userInputs) => {
    const value = (0, core_1.zxcvbn)(password, userInputs);
    return value;
};
exports.checkPassword = checkPassword;
//# sourceMappingURL=index.js.map