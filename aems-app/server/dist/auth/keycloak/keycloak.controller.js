"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var KeycloakController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const _1 = require(".");
const user_decorator_1 = require("../user.decorator");
const swagger_1 = require("@nestjs/swagger");
const node_util_1 = require("node:util");
let KeycloakController = KeycloakController_1 = class KeycloakController {
    constructor() {
        this.logger = new common_1.Logger(KeycloakController_1.name);
    }
    async login(req, user) {
        this.logger.log("Keycloak login initiated");
        if (user) {
            return await (0, node_util_1.promisify)(req.logIn.bind(req))(user);
        }
        else {
            return;
        }
    }
    async callback(req, res, user) {
        this.logger.log("Keycloak callback received");
        if (user) {
            return await (0, node_util_1.promisify)(req.logIn.bind(req))(user).then(() => typeof req.query.redirect === "string" ? res.redirect(req.query.redirect) : res.redirect("/"));
        }
        else {
            return;
        }
    }
};
exports.KeycloakController = KeycloakController;
__decorate([
    (0, swagger_1.ApiTags)(_1.Provider, "auth", "login"),
    (0, common_1.Post)("login"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)(_1.Provider)),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KeycloakController.prototype, "login", null);
__decorate([
    (0, swagger_1.ApiTags)(_1.Provider, "auth", "callback"),
    (0, common_1.Get)("callback"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)(_1.Provider)),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], KeycloakController.prototype, "callback", null);
exports.KeycloakController = KeycloakController = KeycloakController_1 = __decorate([
    (0, swagger_1.ApiTags)(_1.Provider),
    (0, common_1.Controller)(_1.Provider)
], KeycloakController);
//# sourceMappingURL=keycloak.controller.js.map