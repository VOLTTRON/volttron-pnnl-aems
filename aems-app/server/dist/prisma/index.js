"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaPubSub = void 0;
const graphql_subscriptions_1 = require("graphql-subscriptions");
const common_1 = require("@nestjs/common");
class PrismaPubSub extends graphql_subscriptions_1.PubSub {
    constructor({ prisma, ...options }) {
        super(options);
        this.logger = new common_1.Logger(PrismaPubSub.name);
        this.cancel = null;
        this.running = false;
        this.previous = new Date();
        this.prisma = prisma;
        this.cancel = setInterval(() => this.execute(), 1000);
    }
    execute() {
        if (this.running) {
            return;
        }
        const current = new Date();
        this.prisma.event
            .findMany({
            where: { createdAt: { gte: this.previous, lt: current } },
            orderBy: { createdAt: "asc" },
        })
            .then(async (events) => {
            await Promise.all(events.map((event) => super.publish(event.topic, event.payload)));
            this.previous = current;
        })
            .catch((error) => this.logger.error(error, "Failed to execute PrismaPubSub"))
            .finally(() => (this.running = false));
    }
    async publish(topic, payload) {
        return this.prisma.event
            .create({
            data: {
                topic: topic,
                payload: payload,
            },
        })
            .then(() => undefined);
    }
    asyncIterator(triggers) {
        return super.asyncIterableIterator(triggers);
    }
    [Symbol.dispose]() {
        this.cancel?.unref();
    }
}
exports.PrismaPubSub = PrismaPubSub;
//# sourceMappingURL=index.js.map