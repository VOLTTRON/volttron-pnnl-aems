"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicRoute = exports.IsPublicKey = void 0;
const common_1 = require("@nestjs/common");
exports.IsPublicKey = Symbol("isPublic");
const PublicRoute = () => (0, common_1.SetMetadata)(exports.IsPublicKey, true);
exports.PublicRoute = PublicRoute;
//# sourceMappingURL=public.decorator.js.map