import { buildExpressUser } from "@/auth";
import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { compare } from "@node-rs/bcrypt";
import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Provider } from ".";
import { Credentials, ProviderInfo } from "@local/common";

@Injectable()
export class LocalService extends PassportStrategy(Strategy, Provider) implements ProviderInfo<Credentials> {
  private logger = new Logger(LocalService.name);

  readonly name = Provider;
  readonly label = "Local";
  readonly credentials = {
    email: { label: "Email", name: "email", type: "text" as const, placeholder: "email" },
    password: { label: "Password", name: "current-password", type: "password" as const },
  };

  constructor(
    authService: AuthService,
    private prismaService: PrismaService,
  ) {
    super({ usernameField: "email", passwordField: "password" });
    authService.registerProvider(this);
  }

  async validate(email: string, password: string): Promise<Express.User | null> {
    const user = await this.prismaService.prisma.user.findUnique({ where: { email: email } });
    // supplied password always checked to prevent timing attacks
    const authorized = await compare(password, user?.password ?? "");
    if (user && authorized) {
      return buildExpressUser(user);
    } else {
      return null;
    }
  }
}
