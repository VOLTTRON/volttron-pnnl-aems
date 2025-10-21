import { Module } from "@nestjs/common";
import { ExtRewriteMiddleware } from "./ext.middleware";

@Module({
  providers: [ExtRewriteMiddleware],
  exports: [ExtRewriteMiddleware],
})
export class ExtModule {}
