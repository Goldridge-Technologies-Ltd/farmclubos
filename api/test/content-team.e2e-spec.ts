import { jest } from "@jest/globals";
import { ConflictException, type INestApplication } from "@nestjs/common";
import request from "supertest";
import type { ApiErrorResponse, ApiSuccessResponse } from "../src/common/http/api-response.js";
import { ContentTeamModule } from "../src/modules/content-team/content-team.module.js";
import { ContentTeamService } from "../src/modules/content-team/content-team.service.js";
import { createTestApp } from "./support/create-test-app.js";

const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;
const asFailure = (body: unknown) => body as ApiErrorResponse;

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const INVITE_ID = "01a0d0d8-0000-7000-8000-000000000041";
const USER_ID = "01a0d0d8-0000-7000-8000-000000000042";

/*
  The content team's routes, as a platform administrator uses them. The rules
  live in the service, which has its own spec; these cover the HTTP contract:
  who may call, the envelope, and what is refused before the service runs.
*/
describe("Content team (e2e)", () => {
  let app: INestApplication;
  let signAccessToken: (claims: object) => Promise<string>;
  const team = { list: fn(), invite: fn(), resend: fn(), revoke: fn(), remove: fn() };

  beforeAll(async () => {
    ({ app, signAccessToken } = await createTestApp({
      imports: [ContentTeamModule],
      overrides: [{ provide: ContentTeamService, useValue: team }],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const platformAdmin = () => signAccessToken({ platformRole: "PLATFORM_ADMIN" });

  it("refuses without a token", async () => {
    await request(app.getHttpServer()).get("/api/content-team").expect(401);
  });

  it.each(["CONTENT_MANAGER", "NONE"])(
    "refuses a %s at the route, before the service runs",
    async (platformRole) => {
      const token = await signAccessToken({ platformRole });

      const response = await request(app.getHttpServer())
        .get("/api/content-team")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(asFailure(response.body).error.code).toBe("INSUFFICIENT_ROLE");
      expect(team.list).not.toHaveBeenCalled();
    },
  );

  it("lists the team in the envelope", async () => {
    team.list.mockResolvedValue({ members: [], invitations: [] });

    const response = await request(app.getHttpServer())
      .get("/api/content-team")
      .set("Authorization", `Bearer ${await platformAdmin()}`)
      .expect(200);

    expect(asSuccess(response.body)).toMatchObject({
      success: true,
      message: "Content team loaded",
      data: { members: [], invitations: [] },
    });
  });

  it("invites by email with 201, trimming the address", async () => {
    team.invite.mockResolvedValue({ id: INVITE_ID, emailStatus: "SENT" });

    await request(app.getHttpServer())
      .post("/api/content-team/invites")
      .set("Authorization", `Bearer ${await platformAdmin()}`)
      .send({ email: "  maker@example.com " })
      .expect(201);

    expect(team.invite).toHaveBeenCalledWith(expect.anything(), { email: "maker@example.com" });
  });

  it("refuses an address that is not an email, before the service runs", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/content-team/invites")
      .set("Authorization", `Bearer ${await platformAdmin()}`)
      .send({ email: "not an email" })
      .expect(400);

    expect(asFailure(response.body).error.code).toBe("VALIDATION_FAILED");
    expect(team.invite).not.toHaveBeenCalled();
  });

  it("passes a refusal through with its code", async () => {
    team.invite.mockRejectedValue(
      new ConflictException({ code: "ALREADY_CONTENT_TEAM", message: "Already on the team." }),
    );

    const response = await request(app.getHttpServer())
      .post("/api/content-team/invites")
      .set("Authorization", `Bearer ${await platformAdmin()}`)
      .send({ email: "maker@example.com" })
      .expect(409);

    expect(asFailure(response.body).error.code).toBe("ALREADY_CONTENT_TEAM");
  });

  it("resends, withdraws and removes with 200", async () => {
    const token = await platformAdmin();
    team.resend.mockResolvedValue({ id: INVITE_ID });
    team.revoke.mockResolvedValue({ id: INVITE_ID });
    team.remove.mockResolvedValue({ id: USER_ID });

    for (const path of [
      `/api/content-team/invites/${INVITE_ID}/resend`,
      `/api/content-team/invites/${INVITE_ID}/revoke`,
      `/api/content-team/members/${USER_ID}/remove`,
    ]) {
      await request(app.getHttpServer()).post(path).set("Authorization", `Bearer ${token}`).expect(200);
    }

    expect(team.resend).toHaveBeenCalledWith(expect.anything(), INVITE_ID);
    expect(team.revoke).toHaveBeenCalledWith(expect.anything(), INVITE_ID);
    expect(team.remove).toHaveBeenCalledWith(expect.anything(), USER_ID);
  });

  it("refuses an id that is not a uuid, before the service runs", async () => {
    const token = await platformAdmin();

    await request(app.getHttpServer())
      .post("/api/content-team/members/someone/remove")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/content-team/invites/abc/resend")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    expect(team.remove).not.toHaveBeenCalled();
    expect(team.resend).not.toHaveBeenCalled();
  });
});
