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
var VolttronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolttronService = void 0;
const app_config_1 = require("../app.config");
const common_1 = require("@nestjs/common");
const node_util_1 = require("node:util");
const undici_1 = require("undici");
let VolttronService = VolttronService_1 = class VolttronService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(VolttronService_1.name);
        this.maxRetries = 3;
        this.agent = new undici_1.Agent({
            connect: { keepAlive: true, ca: this.configService.volttron.ca },
            connectTimeout: this.configService.service.config.timeout,
        });
    }
    onModuleDestroy() {
        this.agent.destroy();
    }
    async makeAuthCall() {
        if (this.configService.volttron.mocked) {
            this.logger.log("Mocked Volttron Auth call");
            return "mocked_access_token";
        }
        const body = {
            username: this.configService.service.config.username,
            password: this.configService.service.config.password,
        };
        const response = await (0, undici_1.fetch)(`${this.configService.service.config.authUrl}`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
            dispatcher: this.agent,
        });
        const json = await response.json();
        if (typeof json?.access_token !== "string") {
            throw new Error(`Failed Volttron Auth call: ${(0, node_util_1.inspect)(json)}`);
        }
        return json.access_token;
    }
    async makeApiCall(id, method, token, data) {
        if (this.configService.volttron.mocked) {
            this.logger.log(`Mocked Volttron API call: ${method}`);
            return { jsonrpc: "2.0", id: id, result: {} };
        }
        return this.makeApiCallWithRetry(id, method, token, data);
    }
    async makeApiCallWithRetry(id, method, token, data, attempt = 0) {
        const body = {
            jsonrpc: "2.0",
            id: id,
            method: method,
            params: {
                authentication: token,
                data: data,
            },
        };
        try {
            if (this.configService.service.config.verbose) {
                this.logger.log((0, node_util_1.inspect)({ url: this.configService.service.config.apiUrl, body: body }, undefined, 10));
            }
            const response = await (0, undici_1.fetch)(`${this.configService.service.config.apiUrl}`, {
                method: "POST",
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                dispatcher: this.agent,
            });
            const json = await response.json();
            if (this.configService.service.config.verbose) {
                this.logger.log((0, node_util_1.inspect)({ url: this.configService.service.config.apiUrl, response: json }, undefined, 10));
            }
            if (typeof json?.result === "string") {
                throw new Error(`Failed Volttron API ${method} call: ${(0, node_util_1.inspect)(json)}`);
            }
            else if (!json?.result) {
                throw new Error(`Failed Volttron API ${method} call.`);
            }
            return json;
        }
        catch (error) {
            const isLastAttempt = attempt >= this.maxRetries - 1;
            if (isLastAttempt || (error instanceof Error && error.message.includes("Auth"))) {
                throw error;
            }
            const backoffMs = Math.pow(2, attempt) * 1000;
            this.logger.warn(`API call ${method} failed (attempt ${attempt + 1}/${this.maxRetries}): ${error instanceof Error ? error.message : String(error)}. Retrying in ${backoffMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            return this.makeApiCallWithRetry(id, method, token, data, attempt + 1);
        }
    }
};
exports.VolttronService = VolttronService;
exports.VolttronService = VolttronService = VolttronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService])
], VolttronService);
//# sourceMappingURL=volttron.service.js.map