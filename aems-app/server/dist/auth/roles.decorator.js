"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.RolesKey = void 0;
const common_1 = require("@nestjs/common");
exports.RolesKey = Symbol("roles");
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.RolesKey, roles);
exports.Roles = Roles;
//# sourceMappingURL=roles.decorator.js.map