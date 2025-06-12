"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpStatusEnum = exports.RoleEnum = void 0;
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["Super"] = "super";
    RoleEnum["Admin"] = "admin";
    RoleEnum["User"] = "user";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var HttpStatusEnum;
(function (HttpStatusEnum) {
    HttpStatusEnum["Information"] = "information";
    HttpStatusEnum["Success"] = "success";
    HttpStatusEnum["Redirect"] = "redirect";
    HttpStatusEnum["ClientError"] = "client-error";
    HttpStatusEnum["ServerError"] = "server-error";
})(HttpStatusEnum || (exports.HttpStatusEnum = HttpStatusEnum = {}));
//# sourceMappingURL=index.js.map