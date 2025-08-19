import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SessionData, Store } from "express-session";
import { typeofObject } from "@local/common";

@Injectable()
export class PrismaSessionStore extends Store {
  constructor(private prismaService: PrismaService) {
    super();
  }

  get(id: string, callback: (err: any, session?: SessionData | null) => void): void {
    this.prismaService.prisma.session
      .findFirst({ where: { id: id, expires: { gt: new Date() } } })
      .then((session) =>
        typeofObject<SessionData>(session?.data) ? callback(null, session.data) : callback(null, null),
      )
      .catch((err) => callback(err));
  }

  set(id: string, session: SessionData, callback?: (err?: any) => void): void {
    const expiresAt = new Date(Date.now() + (session.cookie.maxAge ?? 86400000));
    const userId = session.passport?.user;
    if (!userId) {
      return callback?.(new Error("User ID is required to set session"));
    }
    this.prismaService.prisma.session
      .upsert({
        where: { id },
        update: { data: session, expires: expiresAt },
        create: { id: id, data: session, expires: expiresAt, sessionToken: "", userId: userId },
      })
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }

  destroy(id: string, callback?: (err?: any) => void): void {
    this.prismaService.prisma.session
      .deleteMany({ where: { id } })
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }
}
