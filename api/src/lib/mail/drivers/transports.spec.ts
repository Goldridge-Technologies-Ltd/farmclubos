import { jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";
import { LogMailTransport } from "./log-mail.transport.js";
import { SmtpMailTransport } from "./smtp-mail.transport.js";

const mail = {
  from: "FARMCLUB OS <no-reply@farmclubos.com>",
  to: "learner@example.com",
  subject: "Reset your FARMCLUB OS password",
  html: "<p>reset</p>",
  text: "Reset password: http://localhost:3001/reset-password?token=xyz",
};

afterEach(() => jest.restoreAllMocks());

describe("LogMailTransport", () => {
  it("writes the recipient, subject and text body to the log", async () => {
    const log = jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);

    const result = await new LogMailTransport().send(mail);

    expect(log).toHaveBeenCalledWith(expect.stringContaining("To: learner@example.com"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining(mail.text));
    expect(result.messageId).toMatch(/^log-/);
  });
});

describe("SmtpMailTransport", () => {
  const settings: Record<string, unknown> = {
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    SMTP_USER: "mailer",
    SMTP_PASSWORD: "pw",
  };
  const config = {
    get: (key: string) => settings[key],
    getOrThrow: (key: string) => settings[key],
  } as unknown as ConfigService;

  it("does not connect until the first email, so it can exist without SMTP settings", () => {
    const createTransport = jest.spyOn(nodemailer, "createTransport");

    new SmtpMailTransport(config);

    expect(createTransport).not.toHaveBeenCalled();
  });

  it("connects with the configured settings and reuses the connection", async () => {
    const sendMail = jest.fn(() => Promise.resolve({ messageId: "smtp-1" }));
    const createTransport = jest
      .spyOn(nodemailer, "createTransport")
      .mockReturnValue({ sendMail } as never);

    const transport = new SmtpMailTransport(config);
    await transport.send(mail);
    const second = await transport.send(mail);

    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "mailer", pass: "pw" },
    });
    expect(second.messageId).toBe("smtp-1");
  });
});
