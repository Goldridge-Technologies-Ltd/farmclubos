import { jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../database/prisma.service.js";
import { MAIL_TRANSPORT, type MailTransport } from "./mail-transport.js";
import { MailService } from "./mail.service.js";

describe("MailService", () => {
  let service: MailService;
  let transport: { send: jest.Mock<MailTransport["send"]> };
  let emailMessage: {
    create: jest.Mock<(args: unknown) => Promise<{ id: string }>>;
    update: jest.Mock<(args: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    transport = { send: jest.fn<MailTransport["send"]>() };
    emailMessage = {
      create: jest.fn<(args: unknown) => Promise<{ id: string }>>().mockResolvedValue({ id: "email-1" }),
      update: jest.fn<(args: unknown) => Promise<unknown>>().mockResolvedValue({}),
    };
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MAIL_TRANSPORT, useValue: transport },
        { provide: PrismaService, useValue: { emailMessage } },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) =>
              ({ MAIL_FROM: "FARMCLUB OS <no-reply@farmclubos.com>" })[key],
          },
        },
      ],
    }).compile();

    service = moduleRef.get(MailService);
  });

  afterEach(() => jest.restoreAllMocks());

  const invite = {
    to: "learner@example.com",
    institutionId: "institution-1",
    institutionName: "Greenfield Technical College",
    inviterName: "Ada Obi",
    role: "LEARNER" as const,
    acceptUrl: "http://localhost:3001/accept-invite?token=abc",
    expiresInDays: 7,
  };

  it("sends a content-team invitation, which belongs to no institution", async () => {
    transport.send.mockResolvedValue({ messageId: "provider-43" });

    await expect(
      service.sendContentTeamInvite({
        to: "maker@example.com",
        inviterName: "Ada Obi",
        acceptUrl: "http://localhost:3001/accept-invite?token=abc",
        expiresInDays: 7,
      }),
    ).resolves.toBe("SENT");

    expect(emailMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        to: "maker@example.com",
        template: "content-team-invite",
        status: "QUEUED",
      }),
    });
    expect(emailMessage.create).toHaveBeenCalledWith({
      data: expect.not.objectContaining({ institutionId: expect.anything() }),
    });
    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("content team") }),
    );
  });

  it("records the email before sending, then marks it sent", async () => {
    transport.send.mockResolvedValue({ messageId: "provider-42" });

    await expect(service.sendInvite(invite)).resolves.toBe("SENT");

    expect(emailMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        to: "learner@example.com",
        template: "invite",
        status: "QUEUED",
        institutionId: "institution-1",
      }),
    });
    expect(emailMessage.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: expect.objectContaining({
        status: "SENT",
        providerMessageId: "provider-42",
        sentAt: expect.any(Date),
      }),
    });
  });

  it("sends from the configured address with both parts", async () => {
    transport.send.mockResolvedValue({ messageId: "provider-42" });

    await service.sendInvite(invite);

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "FARMCLUB OS <no-reply@farmclubos.com>",
        to: "learner@example.com",
        subject: expect.stringContaining("Greenfield Technical College"),
        html: expect.stringContaining("<html"),
        text: expect.stringContaining(invite.acceptUrl),
      }),
    );
  });

  it("marks a delivery failure without throwing, so the caller's work survives", async () => {
    transport.send.mockRejectedValue(new Error("connection refused"));

    await expect(service.sendInvite(invite)).resolves.toBe("FAILED");

    expect(emailMessage.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { status: "FAILED", error: "connection refused" },
    });
  });

  it("links a password reset email to the user", async () => {
    transport.send.mockResolvedValue({ messageId: "provider-7" });

    await service.sendPasswordReset({
      to: "learner@example.com",
      userId: "user-1",
      firstName: "Tunde",
      resetUrl: "http://localhost:3001/reset-password?token=xyz",
      expiresInMinutes: 60,
    });

    expect(emailMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ template: "password-reset", userId: "user-1" }),
    });
  });
});
