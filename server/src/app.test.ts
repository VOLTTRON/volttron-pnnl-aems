// import { INestApplication } from "@nestjs/common";
// import * as request from "supertest";
// import { App } from "supertest/types";
// import { Test } from "@nestjs/testing";
// import { AppModule } from "./../src/app.module";
// import { ConfigModule } from "@nestjs/config";
// import { AppConfigToken } from "./app.config";

// fixme: test is currently skipped because of open handles

describe("AppModule (e2e)", () => {
  // let app: INestApplication<App>;

  // beforeAll(async () => {
  //   const module = await Test.createTestingModule({
  //     imports: [
  //       ConfigModule.forRoot({
  //         isGlobal: true,
  //         expandVariables: true,
  //         load: [AppConfigToken],
  //         envFilePath: ".env.test",
  //       }),
  //       AppModule,
  //     ],
  //   }).compile();

  //   app = module.createNestApplication();
  //   await app.init();
  // });

  it.skip("/ (GET)", () => {
    // return request(app.getHttpServer()).get("/").expect(404);
  });

  // afterAll(async () => {
  //   await app.close();
  // });
});
