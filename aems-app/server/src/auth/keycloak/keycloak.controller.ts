import { Controller, Get, Logger, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { Provider } from ".";
import { User } from "../user.decorator";
import { ApiTags } from "@nestjs/swagger";
import { promisify } from "node:util";

@ApiTags(Provider)
@Controller(Provider)
export class KeycloakController {
  private logger = new Logger(KeycloakController.name);

  @ApiTags(Provider, "auth", "login")
  @Post("login")
  @UseGuards(AuthGuard(Provider))
  async login(@Req() req: Request, @User() user: Express.User) {
    this.logger.log("Keycloak login initiated");
    if (user) {
      return await promisify(req.logIn.bind(req))(user);
    } else {
      return;
    }
  }

  @ApiTags(Provider, "auth", "callback")
  @Get("callback")
  @UseGuards(AuthGuard(Provider))
  async callback(@Req() req: Request, @Res() res: Response, @User() user: Express.User) {
    this.logger.log("Keycloak callback received");
    if (user) {
      return await promisify(req.logIn.bind(req))(user).then(() =>
        typeof req.query.redirect === "string" ? res.redirect(req.query.redirect) : res.redirect("/"),
      );
    } else {
      return;
    }
  }
}
