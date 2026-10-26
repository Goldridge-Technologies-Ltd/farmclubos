import { jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";
import { LogMailTransport } from "./log-mail.transport.js";
import { SmtpMailTransport } from "./smtp-mail.transport.js";
import { ZeptoMailTransport } from "./zeptomail.transport.js";

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

describe("ZeptoMailTransport", () => {
  const settings: Record<string, unknown> = {
    ZEPTOMAIL_API_KEY: "wSsVR61-secret-key",
    ZEPTOMAIL_API_HOST: "cpaas.zoho.com",
  };
  const config = {
    get: (key: string) => settings[key],
    getOrThrow: (key: string) => settings[key],
  } as unknown as ConfigService;
  const reply = (status: number, body: unknown) =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  const accepted = () =>
    reply(201, { data: [{ code: "EM_104", message: "OK" }], message: "OK", request_id: "req-1" });

  /** What the transport sent: the URL, and the request with its parsed body. */
  const sent = (fetchMock: { mock: { calls: unknown[][] } }) => {
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];

    // The transport always sends its JSON as a string.
    return { url, request, body: JSON.parse(request.body as string) as Record<string, unknown> };
  };

  it("posts to the data centre's send endpoint, authorised with the key", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(accepted());

    const result = await new ZeptoMailTransport(config).send(mail);

    const { url, request } = sent(fetchMock);
    expect(url).toBe("https://cpaas.zoho.com/v1.1/email");
    expect(request.method).toBe("POST");
    expect(request.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Zoho-enczapikey wSsVR61-secret-key",
    });
    expect(result.messageId).toBe("req-1");
  });

  /*
    Click tracking would send every single-use invitation and reset link
    through a redirect of Zoho's, so both kinds of tracking are switched off
    here, whatever the Mail Agent's own setting.
  */
  it("sends the sender, recipient, subject and both bodies, with tracking off", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(accepted());

    await new ZeptoMailTransport(config).send(mail);

    expect(sent(fetchMock).body).toEqual({
      from: { address: "no-reply@farmclubos.com", name: "FARMCLUB OS" },
      to: [{ email_address: { address: "learner@example.com" } }],
      subject: "Reset your FARMCLUB OS password",
      htmlbody: "<p>reset</p>",
      textbody: "Reset password: http://localhost:3001/reset-password?token=xyz",
      track_clicks: false,
      track_opens: false,
    });
  });

  it("takes a bare sender address, with no name", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(accepted());

    await new ZeptoMailTransport(config).send({ ...mail, from: "no-reply@farmclubos.com" });

    expect(sent(fetchMock).body.from).toEqual({ address: "no-reply@farmclubos.com" });
  });

  it("accepts a key pasted with its Zoho-enczapikey prefix, as ZeptoMail shows it", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(accepted());
    const prefixed = {
      get: (key: string) => (key === "ZEPTOMAIL_API_KEY" ? "Zoho-enczapikey wSsVR61-secret-key" : settings[key]),
      getOrThrow: (key: string) =>
        key === "ZEPTOMAIL_API_KEY" ? "Zoho-enczapikey wSsVR61-secret-key" : settings[key],
    } as unknown as ConfigService;

    await new ZeptoMailTransport(prefixed).send(mail);

    expect(sent(fetchMock).request.headers).toMatchObject({
      Authorization: "Zoho-enczapikey wSsVR61-secret-key",
    });
  });

  it("gives up rather than hang when ZeptoMail does not answer", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(accepted());

    await new ZeptoMailTransport(config).send(mail);

    expect(sent(fetchMock).request.signal).toBeInstanceOf(AbortSignal);
  });

  it("says why ZeptoMail refused, with its codes, and never the key", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      reply(401, {
        error: {
          code: "TM_4001",
          details: [{ code: "SERR_157", message: "Invalid API Token found" }],
          message: "Access Denied",
          request_id: "req-2",
        },
      }),
    );

    const failure = new ZeptoMailTransport(config).send(mail);

    await expect(failure).rejects.toThrow(
      "ZeptoMail refused the email (HTTP 401): Access Denied (TM_4001): Invalid API Token found (SERR_157)",
    );
    await expect(failure).rejects.not.toThrow(/wSsVR61/);
  });

  it("reads the newer error shape too", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      reply(400, { data: { error_code: "TM_3004", message: "Invalid request" }, message: "error" }),
    );

    await expect(new ZeptoMailTransport(config).send(mail)).rejects.toThrow(
      "ZeptoMail refused the email (HTTP 400): Invalid request (TM_3004)",
    );
  });

  it("says when ZeptoMail could not be reached at all", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));

    await expect(new ZeptoMailTransport(config).send(mail)).rejects.toThrow(
      "ZeptoMail could not be reached: fetch failed",
    );
  });

  it("reports a reply that is not JSON by its status", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(reply(502, "<html>Bad gateway</html>"));

    await expect(new ZeptoMailTransport(config).send(mail)).rejects.toThrow(
      "ZeptoMail refused the email (HTTP 502)",
    );
  });
});
