import { buildExpressUser } from "@/auth";
import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Provider } from ".";
import { Credentials, ProviderInfo } from "@local/common";

@Injectable()
export class SuperService extends PassportStrategy(Strategy, Provider) implements ProviderInfo<Credentials> {
  readonly name = Provider;
  readonly label = "Super";
  readonly credentials = {
    id: { label: "ID", type: "text" as const, required: true },
  };

  constructor(
    authService: AuthService,
    private prismaService: PrismaService,
  ) {
    super({ usernameField: "id", passwordField: "password" });
    authService.registerProvider(this);
  }

  async validate(id: string, _password: string): Promise<Express.User | null> {
    const user = await this.prismaService.prisma.user.findUnique({ where: { id: id } });
    if (user) {
      return buildExpressUser(user);
    } else {
      return null;
    }
  }
}
