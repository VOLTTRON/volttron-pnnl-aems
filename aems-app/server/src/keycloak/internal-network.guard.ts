import { AppConfigService } from "@/app.config";
import { CanActivate, ExecutionContext, Inject, Injectable, Logger } from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class InternalNetworkGuard implements CanActivate {
  private logger = new Logger(InternalNetworkGuard.name);

  constructor(@Inject(AppConfigService.Key) private configService: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(request);

    // Check if request is from internal network
    const isInternal = this.isInternalIp(clientIp);

    if (!isInternal) {
      this.logger.warn(`Rejected internal API request from external IP: ${clientIp}`);
    } else {
      this.logger.debug(`Allowed internal API request from: ${clientIp}`);
    }

    return isInternal;
  }

  private getClientIp(request: Request): string {
    // Try to get IP from various headers in order of priority
    const forwardedFor = request.headers["x-forwarded-for"];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(",")[0].trim();
    }

    const realIp = request.headers["x-real-ip"];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    const socketAddress = request.socket.remoteAddress;
    if (socketAddress) {
      return socketAddress;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const connectionAddress = (request.connection as any)?.remoteAddress as string | undefined;
    return connectionAddress || "unknown";
  }

  private isInternalIp(ip: string): boolean {
    // Handle IPv6 localhost
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      return true;
    }

    // Handle IPv4 localhost
    if (ip === "127.0.0.1" || ip === "localhost") {
      return true;
    }

    // Docker internal networks (172.16.0.0/12)
    if (this.isIpInRange(ip, "172.16.0.0", 12)) {
      return true;
    }

    // Private network (10.0.0.0/8)
    if (this.isIpInRange(ip, "10.0.0.0", 8)) {
      return true;
    }

    // Private network (192.168.0.0/16)
    if (this.isIpInRange(ip, "192.168.0.0", 16)) {
      return true;
    }

    return false;
  }

  private isIpInRange(ip: string, network: string, prefixLength: number): boolean {
    try {
      const ipParts = ip.split(".").map(Number);
      const networkParts = network.split(".").map(Number);

      // Validate IP format
      if (ipParts.length !== 4 || networkParts.length !== 4) {
        return false;
      }

      // Convert to 32-bit integers
      const ipInt =
        (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
      const networkInt =
        (networkParts[0] << 24) |
        (networkParts[1] << 16) |
        (networkParts[2] << 8) |
        networkParts[3];

      // Create mask
      const mask = (-1 << (32 - prefixLength)) >>> 0;

      // Compare network portions
      return (ipInt & mask) === (networkInt & mask);
    } catch (error) {
      this.logger.error(`Error checking IP range for ${ip}:`, error);
      return false;
    }
  }
}
