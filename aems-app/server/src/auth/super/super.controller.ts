import { Controller, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { Provider } from ".";
import { Roles } from "../roles.decorator";
import { RoleType } from "@local/common";
import { AuthGuard } from "@nestjs/passport";
import { User } from "../user.decorator";
import { ApiTags } from "@nestjs/swagger";

@ApiTags(Provider)
@Controller(Provider)
export class SuperController {
  @ApiTags(Provider, "auth", "login")
  @Roles(RoleType.Super)
  @UseGuards(AuthGuard(Provider))
  @Post("login")
  async login(@Req() req: Request, @User() user: Express.User) {
    if (user) {
      return new Promise<Express.User>((resolve, reject) =>
        req.logIn(req.user, (err: Error) => (err ? reject(err) : resolve(user))),
      );
    } else {
      return null;
    }
  }
}
