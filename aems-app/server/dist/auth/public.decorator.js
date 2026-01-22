"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Public = exports.IsPublicKey = void 0;
const common_1 = require("@nestjs/common");
exports.IsPublicKey = Symbol("isPublic");
const Public = () => (0, common_1.SetMetadata)(exports.IsPublicKey, true);
exports.Public = Public;
//# sourceMappingURL=public.decorator.js.map