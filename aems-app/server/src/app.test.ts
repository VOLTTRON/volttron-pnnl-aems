// import { INestApplication } from "@nestjs/common";
// import * as request from "supertest";
// import { App } from "supertest/types";
// import { Test } from "@nestjs/testing";
// import { AppModule } from "./../src/app.module";
// import { ConfigModule } from "@nestjs/config";
import { AppConfigService } from "./app.config";
import { PrismaClient } from "@prisma/client";
// import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";
import { PrismaService } from "./prisma/prisma.service";

export class MockPrismaService extends PrismaService {
  constructor(readonly prisma: PrismaClient) {
    super(new AppConfigService(), prisma);
  }
}

describe("AppModule (e2e)", () => {
  // let app: INestApplication<App>;
  // let prisma: DeepMockProxy<PrismaClient>;

  // beforeAll(async () => {
  //   prisma = mockDeep<PrismaClient>();
  //   const module = await Test.createTestingModule({
  //     imports: [
  //       ConfigModule.forRoot({
  //         isGlobal: true,
  //         expandVariables: true,
  //         load: [AppConfigToken],
  //         envFilePath: [".env", ".env.test"],
  //       }),
  //       AppModule,
  //     ],
  //     providers: [
  //       {
  //         provide: PrismaService,
  //         useValue: new MockPrismaService(prisma),
  //       },
  //     ],
  //   }).compile();

  //   app = module.createNestApplication({ abortOnError: true, forceCloseConnections: true });
  //   await app.init();
  // });

  // beforeEach(() => {
  //   mockReset(prisma);
  // });

  // it("/ (GET)", () => {
  //   return request(app.getHttpServer()).get("/").expect(404);
  // });

  // afterAll(async () => {
  //   await app.close();
  // });

  it("todo: implement e2e tests", () => {
    // Placeholder for e2e tests
    expect(true).toBe(true);
  });
});
