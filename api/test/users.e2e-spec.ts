import { jest } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { ApiErrorResponse, ApiSuccessResponse } from "../src/common/http/api-response.js";
import { UsersModule } from "../src/modules/users/users.module.js";
import { UsersService } from "../src/modules/users/users.service.js";
import { createTestApp } from "./support/create-test-app.js";

const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;
const asFailure = (body: unknown) => body as ApiErrorResponse;

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

/* The profile HTTP contract. UsersService is stubbed. */
describe("Users (e2e)", () => {
  let app: INestApplication;
  let token: string;
  const users = { getProfile: fn(), updateProfile: fn(), changePassword: fn() };

  beforeAll(async () => {
    const built = await createTestApp({
      imports: [UsersModule],
      overrides: [{ provide: UsersService, useValue: users }],
    });
    app = built.app;
    token = await built.signAccessToken({ institutionRole: "LEARNER" });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  const server = () => app.getHttpServer();

  it("GET /api/users/me requires a token", async () => {
    await request(server()).get("/api/users/me").expect(401);
  });

  it("PATCH /api/users/me refuses a learner trying to set their own state", async () => {
    const response = await request(server())
      .patch("/api/users/me")
      .set("authorization", `Bearer ${token}`)
      .send({ learnerProfile: { state: "EXISTING_ENTERPRISE" } })
      .expect(400);

    expect(asFailure(response.body).error.code).toBe("VALIDATION_FAILED");
    expect(users.updateProfile).not.toHaveBeenCalled();
  });

  it("PATCH /api/users/me refuses to clear a name with null", async () => {
    await request(server())
      .patch("/api/users/me")
      .set("authorization", `Bearer ${token}`)
      .send({ firstName: null })
      .expect(400);
  });

  it("PATCH /api/users/me accepts null to clear an optional learner detail", async () => {
    users.updateProfile.mockResolvedValue({ id: "user-1" });

    await request(server())
      .patch("/api/users/me")
      .set("authorization", `Bearer ${token}`)
      .send({ learnerProfile: { bio: null, gender: "FEMALE", dateOfBirth: "2004-03-09" } })
      .expect(200);

    expect(users.updateProfile).toHaveBeenCalledWith(
      expect.anything(),
      { learnerProfile: { bio: null, gender: "FEMALE", dateOfBirth: "2004-03-09" } },
    );
  });

  it("PATCH /api/users/me rejects a malformed date", async () => {
    await request(server())
      .patch("/api/users/me")
      .set("authorization", `Bearer ${token}`)
      .send({ learnerProfile: { dateOfBirth: "09/03/2004" } })
      .expect(400);
  });

  it("POST /api/users/me/password enforces the policy on the new password only", async () => {
    users.changePassword.mockResolvedValue(undefined);

    const response = await request(server())
      .post("/api/users/me/password")
      .set("authorization", `Bearer ${token}`)
      .send({ currentPassword: "short", newPassword: "a new long passphrase" })
      .expect(200);

    expect(asSuccess(response.body).message).toBe(
      "Password changed. Your other devices have been signed out.",
    );
  });
});
