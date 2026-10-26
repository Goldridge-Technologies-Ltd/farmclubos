import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailDriver } from "../../config/env.validation.js";
import { LogMailTransport } from "./drivers/log-mail.transport.js";
import { SmtpMailTransport } from "./drivers/smtp-mail.transport.js";
import { ZeptoMailTransport } from "./drivers/zeptomail.transport.js";
import { MAIL_TRANSPORT } from "./mail-transport.js";
import { MailService } from "./mail.service.js";

/*
  Infrastructure module: global, exports its service, and is imported exactly
  once in AppModule (api/AGENTS.md). Every transport is registered so Nest
  constructs them — none connects until it sends — and MAIL_DRIVER picks
  which one MailService receives.
*/
@Global()
@Module({
  providers: [
    LogMailTransport,
    SmtpMailTransport,
    ZeptoMailTransport,
    {
      provide: MAIL_TRANSPORT,
      inject: [ConfigService, LogMailTransport, SmtpMailTransport, ZeptoMailTransport],
      useFactory: (
        config: ConfigService,
        log: LogMailTransport,
        smtp: SmtpMailTransport,
        zeptoMail: ZeptoMailTransport,
      ) => {
        switch (config.get<MailDriver>("MAIL_DRIVER")) {
          case MailDriver.Smtp:
            return smtp;
          case MailDriver.ZeptoMail:
            return zeptoMail;
          default:
            return log;
        }
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
