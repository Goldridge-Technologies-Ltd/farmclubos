/*
  `npm run admin:add --workspace api -- --email <address> [--first-name … --last-name …]`

  Makes someone a platform administrator, which nothing in the web app can do:
  the first one on a new deployment, and any after. It runs where the API
  does, with its environment, from the build (`npm run build` first).
*/
import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { MailDriver } from "../config/env.validation.js";
import { PlatformAdminsService } from "../modules/platform-admins/platform-admins.service.js";
import { CliModule } from "./cli.module.js";
import { readOptions, report, USAGE } from "./platform-admin-command.js";

async function main(): Promise<void> {
  const command = readOptions(process.argv.slice(2));

  if (command.kind === "help") {
    console.log(USAGE);
    return;
  }

  if (command.kind === "error") {
    console.error(`${command.message}\n\n${USAGE}`);
    process.exitCode = 1;
    return;
  }

  // Warnings and errors only: the usual boot log would bury the answer.
  const app = await NestFactory.createApplicationContext(CliModule, { logger: ["warn", "error"] });

  // The log mail driver writes each email, its link included, as a log line.
  if (app.get(ConfigService).getOrThrow<MailDriver>("MAIL_DRIVER") === MailDriver.Log) {
    app.useLogger(["log", "warn", "error"]);
  }

  try {
    const result = await app.get(PlatformAdminsService).add(command.input);

    console.log(report(result));

    if (result.passwordLink?.emailStatus === "FAILED") {
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
