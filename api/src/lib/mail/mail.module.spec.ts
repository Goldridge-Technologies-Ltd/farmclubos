import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../database/prisma.service.js";
import { LogMailTransport } from "./drivers/log-mail.transport.js";
import { SmtpMailTransport } from "./drivers/smtp-mail.transport.js";
import { MAIL_TRANSPORT } from "./mail-transport.js";
import { MailModule } from "./mail.module.js";

/** PrismaModule is @Global() in the app, so the stub is too. */
@Global()
@Module({
  providers: [{ provide: PrismaService, useValue: {} }],
  exports: [PrismaService],
})
class StubPrismaModule {}

async function transportFor(driver: string): Promise<unknown> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [() => ({ MAIL_DRIVER: driver })],
      }),
      StubPrismaModule,
      MailModule,
    ],
  }).compile();

  return moduleRef.get(MAIL_TRANSPORT);
}

describe("MailModule", () => {
  it("hands MailService the log transport when MAIL_DRIVER is log", async () => {
    await expect(transportFor("log")).resolves.toBeInstanceOf(LogMailTransport);
  });

  it("hands MailService the SMTP transport when MAIL_DRIVER is smtp", async () => {
    await expect(transportFor("smtp")).resolves.toBeInstanceOf(SmtpMailTransport);
  });
});
