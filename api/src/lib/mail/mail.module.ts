import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailDriver } from "../../config/env.validation.js";
import { LogMailTransport } from "./drivers/log-mail.transport.js";
import { SmtpMailTransport } from "./drivers/smtp-mail.transport.js";
import { MAIL_TRANSPORT } from "./mail-transport.js";
import { MailService } from "./mail.service.js";

/*
  Infrastructure module: global, exports its service, and is imported exactly
  once in AppModule (api/AGENTS.md). Both transports are registered so Nest
  constructs them; MAIL_DRIVER picks which one MailService receives.
*/
@Global()
@Module({
  providers: [
    LogMailTransport,
    SmtpMailTransport,
    {
      provide: MAIL_TRANSPORT,
      inject: [ConfigService, LogMailTransport, SmtpMailTransport],
      useFactory: (
        config: ConfigService,
        log: LogMailTransport,
        smtp: SmtpMailTransport,
      ) => (config.get<MailDriver>("MAIL_DRIVER") === MailDriver.Smtp ? smtp : log),
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
