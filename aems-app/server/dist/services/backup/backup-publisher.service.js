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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupSubscriptionPublisher = void 0;
const common_1 = require("@nestjs/common");
const subscription_service_1 = require("../../subscription/subscription.service");
let BackupSubscriptionPublisher = class BackupSubscriptionPublisher {
    constructor(subscriptionService) {
        this.subscriptionService = subscriptionService;
    }
    async publishPolicy(id, mutation) {
        await this.subscriptionService.publish("BackupPolicy", { topic: "BackupPolicy", id, mutation });
        await this.subscriptionService.publish(`BackupPolicy/${id}`, { topic: "BackupPolicy", id, mutation });
    }
    async publishDestination(id, mutation) {
        await this.subscriptionService.publish("BackupDestination", { topic: "BackupDestination", id, mutation });
        await this.subscriptionService.publish(`BackupDestination/${id}`, {
            topic: "BackupDestination",
            id,
            mutation,
        });
    }
    async publishRun(id, mutation) {
        await this.subscriptionService.publish("BackupRun", { topic: "BackupRun", id, mutation });
        await this.subscriptionService.publish(`BackupRun/${id}`, { topic: "BackupRun", id, mutation });
    }
    async publishKey(id, mutation) {
        await this.subscriptionService.publish("BackupKey", { topic: "BackupKey", id, mutation });
        await this.subscriptionService.publish(`BackupKey/${id}`, { topic: "BackupKey", id, mutation });
    }
};
exports.BackupSubscriptionPublisher = BackupSubscriptionPublisher;
exports.BackupSubscriptionPublisher = BackupSubscriptionPublisher = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [subscription_service_1.SubscriptionService])
], BackupSubscriptionPublisher);
//# sourceMappingURL=backup-publisher.service.js.map