import { CanActivate, ExecutionContext, Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { timingSafeEqual } from "node:crypto";
import { AppConfigService } from "@/app.config";

const HEADER = "x-worker-token";

/**
 * Guard for the internal /worker/* REST surface. Rejects every request that
 * doesn't present a matching shared secret in the `X-Worker-Token` header.
 *
 * The token is sourced via AppConfigService.service.backup.workerToken,
 * which in turn reads from the WORKER_TOKEN docker secret (preferred) or
 * env var. Comparisons are constant-time to avoid leaking the secret
 * through timing side channels.
 *
 * This is defense-in-depth: the /worker prefix is not on Traefik's allow-list
 * for the server router, so external requests should never reach here. The
 * guard protects against proxy misconfig and rogue containers on the
 * compose network.
 */
@Injectable()
export class WorkerTokenGuard implements CanActivate {
  private readonly logger = new Logger(WorkerTokenGuard.name);
  private readonly expected: Buffer;

  constructor(@Inject(AppConfigService.Key) private readonly configService: AppConfigService) {
    const token = this.configService.service.backup.workerToken.trim() ?? "";
    if (!token) {
      this.logger.error(
        "WORKER_TOKEN is empty; the /worker endpoints will reject every request until it is configured.",
      );
    }
    this.expected = Buffer.from(token, "utf8");
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.expected.length === 0) {
      throw new UnauthorizedException("Worker token not configured on server");
    }
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers[HEADER];
    const presented = typeof header === "string" ? header : Array.isArray(header) ? header[0] : "";
    const presentedBuf = Buffer.from(presented ?? "", "utf8");
    if (presentedBuf.length !== this.expected.length) {
      throw new UnauthorizedException("Invalid worker token");
    }
    if (!timingSafeEqual(presentedBuf, this.expected)) {
      throw new UnauthorizedException("Invalid worker token");
    }
    return true;
  }
}
