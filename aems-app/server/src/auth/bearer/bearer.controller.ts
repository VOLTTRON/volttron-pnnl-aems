import { Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { Provider } from ".";
import { User } from "../user.decorator";
import { ApiTags } from "@nestjs/swagger";

@ApiTags(Provider)
@Controller(Provider)
export class BearerController {
  @ApiTags(Provider, "auth", "login")
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
