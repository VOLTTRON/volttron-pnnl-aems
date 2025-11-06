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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const app_config_1 = require("../app.config");
let AuthService = AuthService_1 = class AuthService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.providers = new Map();
        this.subscribers = [];
        this.notifySubscribers = (provider) => {
            this.subscribers.forEach((subscriber) => subscriber(provider));
        };
        this.subscribe = (subscriber) => {
            this.subscribers.push(subscriber);
        };
        this.unsubscribe = (subscriber) => {
            this.subscribers = this.subscribers.filter((sub) => sub !== subscriber);
        };
        this.registerProvider = (provider) => {
            this.providers.set(provider.name, provider);
            this.logger.log(`Registered provider: ${provider.name}`);
            this.notifySubscribers(provider);
        };
        this.getProviderNames = () => Array.from(this.providers.keys());
        this.getProvider = (name) => {
            const provider = this.providers.get(name);
            return provider && this.configService.auth.providers.includes(name) ? provider : undefined;
        };
        this.logger.log("Initializing auth service");
    }
    onModuleDestroy() {
        this.providers.clear();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map