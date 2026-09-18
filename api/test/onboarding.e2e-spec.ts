import { jest } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../src/common/http/api-response.js";
import { PaginatedResult } from "../src/common/http/api-response.js";
import { InstitutionsModule } from "../src/modules/institutions/institutions.module.js";
import { InstitutionsService } from "../src/modules/institutions/institutions.service.js";
import { InvitesModule } from "../src/modules/invites/invites.module.js";
import { InvitesService } from "../src/modules/invites/invites.service.js";
import { createTestApp } from "./support/create-test-app.js";

const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;
const asFailure = (body: unknown) => body as ApiErrorResponse;

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const INSTITUTION_ID = "0192f1c4-7b2e-7d3a-9c1e-5b8a2f4e6d10";
const INVITE_ID = "0192f1c4-7b2e-7d3a-9c1e-5b8a2f4e6d11";

/*
  The onboarding HTTP contract: route-level roles, public versus signed-in
  routes, validation and pagination. Services are stubbed — their rules are
  covered by their own specs.
*/
describe("Onboarding (e2e)", () => {
  let app: INestApplication;
  let signAccessToken: (claims: object) => Promise<string>;
  const institutions = { create: fn(), list: fn(), findOne: fn(), update: fn() };
  const invites = {
    issue: fn(), list: fn(), resend: fn(), revoke: fn(),
    lookup: fn(), accept: fn(), join: fn(),
  };

  beforeAll(async () => {
    ({ app, signAccessToken } = await createTestApp({
      imports: [InstitutionsModule, InvitesModule],
      overrides: [
        { provide: InstitutionsService, useValue: institutions },
        { provide: InvitesService, useValue: invites },
      ],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  const server = () => app.getHttpServer();
  const platformAdmin = () => signAccessToken({ platformRole: "PLATFORM_ADMIN" });
  const learner = () =>
    signAccessToken({ institutionId: INSTITUTION_ID, institutionRole: "LEARNER" });

  describe("institutions", () => {
    const body = {
      name: "Greenfield Technical College",
      type: "TECHNICAL_COLLEGE",
      contactEmail: "office@greenfield.example.com",
    };

    it("refuses to create without a token", async () => {
      await request(server()).post("/api/institutions").send(body).expect(401);
    });

    it("refuses a non-platform-admin at the route, before the service runs", async () => {
      const response = await request(server())
        .post("/api/institutions")
        .set("authorization", `Bearer ${await learner()}`)
        .send(body)
        .expect(403);

      expect(asFailure(response.body).error.code).toBe("INSUFFICIENT_ROLE");
      expect(institutions.create).not.toHaveBeenCalled();
    });

    it("creates as a platform admin, with 201 and the envelope", async () => {
      institutions.create.mockResolvedValue({ id: INSTITUTION_ID, ...body });

      const response = await request(server())
        .post("/api/institutions")
        .set("authorization", `Bearer ${await platformAdmin()}`)
        .send(body)
        .expect(201);

      expect(asSuccess(response.body)).toMatchObject({
        message: "Institution created",
        data: { id: INSTITUTION_ID },
        meta: { statusCode: 201 },
      });
    });

    it("rejects an unknown institution type", async () => {
      await request(server())
        .post("/api/institutions")
        .set("authorization", `Bearer ${await platformAdmin()}`)
        .send({ ...body, type: "SPACESHIP" })
        .expect(400);
    });

    it("lifts pagination into meta and parses the query string", async () => {
      institutions.list.mockResolvedValue(PaginatedResult.of([{ id: INSTITUTION_ID }], 45, 2, 20));

      const response = await request(server())
        .get("/api/institutions?page=2&pageSize=20&status=ACTIVE")
        .set("authorization", `Bearer ${await platformAdmin()}`)
        .expect(200);

      expect(asSuccess(response.body).data).toEqual([{ id: INSTITUTION_ID }]);
      expect(asSuccess(response.body).meta.pagination).toEqual({
        page: 2,
        pageSize: 20,
        totalItems: 45,
        totalPages: 3,
      });
      expect(institutions.list).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ page: 2, pageSize: 20, status: "ACTIVE" }),
      );
    });

    it("rejects a page size above the limit", async () => {
      await request(server())
        .get("/api/institutions?pageSize=500")
        .set("authorization", `Bearer ${await platformAdmin()}`)
        .expect(400);
    });

    it("rejects an institution id that is not a UUID", async () => {
      await request(server())
        .get("/api/institutions/not-a-uuid")
        .set("authorization", `Bearer ${await learner()}`)
        .expect(400);

      expect(institutions.findOne).not.toHaveBeenCalled();
    });
  });

  describe("invites", () => {
    it("issues an invitation to the institution in the path", async () => {
      invites.issue.mockResolvedValue({ id: INVITE_ID, emailStatus: "SENT" });

      await request(server())
        .post(`/api/institutions/${INSTITUTION_ID}/invites`)
        .set("authorization", `Bearer ${await learner()}`)
        .send({ email: "learner@example.com", role: "LEARNER" })
        .expect(201);

      expect(invites.issue).toHaveBeenCalledWith(
        expect.objectContaining({ institutionId: INSTITUTION_ID }),
        INSTITUTION_ID,
        { email: "learner@example.com", role: "LEARNER" },
      );
    });

    it("rejects an invitation for a role that does not exist", async () => {
      await request(server())
        .post(`/api/institutions/${INSTITUTION_ID}/invites`)
        .set("authorization", `Bearer ${await learner()}`)
        .send({ email: "learner@example.com", role: "OVERLORD" })
        .expect(400);

      expect(invites.issue).not.toHaveBeenCalled();
    });

    it("looks an invitation up without a token", async () => {
      invites.lookup.mockResolvedValue({ email: "learner@example.com", accountExists: false });

      const response = await request(server())
        .post("/api/invites/lookup")
        .send({ token: "t".repeat(43) })
        .expect(200);

      expect(asSuccess(response.body).message).toBe("Invitation found");
    });

    it("accepts without a token, answering 201 for the new account", async () => {
      invites.accept.mockResolvedValue({ accessToken: "access" });

      await request(server())
        .post("/api/invites/accept")
        .send({
          token: "t".repeat(43),
          firstName: "Tunde",
          lastName: "Bello",
          password: "a long enough passphrase",
        })
        .expect(201);
    });

    it("requires a token to join with an existing account", async () => {
      await request(server())
        .post("/api/invites/join")
        .send({ token: "t".repeat(43) })
        .expect(401);

      expect(invites.join).not.toHaveBeenCalled();
    });

    it("trims names and rejects a blank one", async () => {
      await request(server())
        .post("/api/invites/accept")
        .send({
          token: "t".repeat(43),
          firstName: "   ",
          lastName: "Bello",
          password: "a long enough passphrase",
        })
        .expect(400);

      expect(invites.accept).not.toHaveBeenCalled();
    });
  });
});
