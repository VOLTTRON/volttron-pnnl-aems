import { ConsoleLogger } from "@nestjs/common";

// ConsoleLogger.printMessages is protected — all NestJS log output flows through it.
// Cast via unknown to override it globally so InfoLogger tests don't pollute test output.
(ConsoleLogger.prototype as unknown as { printMessages: jest.Mock }).printMessages = jest.fn();
