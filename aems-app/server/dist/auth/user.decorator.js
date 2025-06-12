"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const common_1 = require("@nestjs/common");
exports.User = (0, common_1.createParamDecorator)((_data, ctx) => ctx.switchToHttp().getRequest()?.user);
//# sourceMappingURL=user.decorator.js.map