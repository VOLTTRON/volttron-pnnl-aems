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
var SubscriptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const graphql_redis_subscriptions_1 = require("graphql-redis-subscriptions");
const common_1 = require("@nestjs/common");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const prisma_1 = require("../prisma");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_1 = require("../app.config");
class PubSubExt extends graphql_subscriptions_1.PubSub {
    asyncIterator(triggers) {
        return super.asyncIterableIterator(triggers);
    }
}
let SubscriptionService = SubscriptionService_1 = class SubscriptionService {
    constructor(prismaService, configService) {
        const logger = new common_1.Logger(SubscriptionService_1.name);
        switch (configService.graphql.pubsub) {
            case "redis":
            case "ioredis":
                this.instance = new graphql_redis_subscriptions_1.RedisPubSub({
                    connection: {
                        host: configService.redis.host,
                        port: configService.redis.port,
                        retryStrategy: (n) => {
                            return Math.min(n * 50, 2000);
                        },
                    },
                });
                logger.log("Setup Redis GraphQL subscription connection");
                break;
            case "prisma":
            case "database":
            case "postgres":
            case "postgresql":
                this.instance = new prisma_1.PrismaPubSub({ prisma: prismaService.prisma });
                logger.log("Setup Prisma GraphQL subscription connection");
                break;
            case "memory":
            case "":
            case undefined:
                this.instance = new PubSubExt();
                logger.log("Setup in-memory GraphQL subscription connection");
                if (configService.nodeEnv === "production") {
                    logger.warn("The in-memory GraphQL subscription connection is not recommended for production.");
                }
                break;
            default:
                this.instance = new PubSubExt();
                logger.warn(`Unknown GraphQL subscription type specified: ${configService.graphql.pubsub}`);
                break;
        }
    }
    publish(triggerName, payload) {
        return this.instance.publish(triggerName, payload);
    }
    subscribe(triggerName, onMessage, options) {
        return this.instance.subscribe(triggerName, onMessage, options);
    }
    unsubscribe(subId) {
        return this.instance.unsubscribe(subId);
    }
    asyncIterator(triggers) {
        return this.instance.asyncIterator(triggers);
    }
    asyncIterableIterator(triggers) {
        return this.instance.asyncIterableIterator(triggers);
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = SubscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, app_config_1.AppConfigService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map