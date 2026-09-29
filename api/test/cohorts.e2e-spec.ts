import { jest } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../src/common/http/api-response.js";
import { CohortsModule } from "../src/modules/cohorts/cohorts.module.js";
import { CohortsService } from "../src/modules/cohorts/cohorts.service.js";
import { InstitutionAccessService } from "../src/modules/institutions/institution-access.service.js";
import { createTestApp } from "./support/create-test-app.js";

const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;
const asFailure = (body: unknown) => body as ApiErrorResponse;

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const INSTITUTION = "01a0d0d8-0000-7000-8000-000000000001";
const COHORT = "01a0d0d8-0000-7000-8000-000000000002";
const ENROLMENT = "01a0d0d8-0000-7000-8000-000000000003";

/*
  The cohort lifecycle's HTTP contract: routing, validation, the envelope.
  The services are stubbed — their rules are covered by their own specs.
*/
describe("Cohort lifecycle (e2e)", () => {
  let app: INestApplication;
  let signAccessToken: (claims: object) => Promise<string>;
  const cohorts = {
    listMine: fn(),
    getMine: fn(),
    listForInstitution: fn(),
    getForInstitution: fn(),
    createCohort: fn(),
    enrol: fn(),
    updateCohort: fn(),
    closeCohort: fn(),
    reopenCohort: fn(),
    withdraw: fn(),
  };
  const access = { assertCanManage: fn(), assertCanView: fn(), assertPlatformAdmin: fn() };

  beforeAll(async () => {
    ({ app, signAccessToken } = await createTestApp({
      imports: [CohortsModule],
      overrides: [
        { provide: CohortsService, useValue: cohorts },
        { provide: InstitutionAccessService, useValue: access },
      ],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    access.assertCanManage.mockResolvedValue({});
  });

  const server = () => app.getHttpServer();
  const asAdmin = async () =>
    `Bearer ${await signAccessToken({ institutionId: INSTITUTION, institutionRole: "INSTITUTION_ADMIN" })}`;
  const base = `/api/institutions/${INSTITUTION}/cohorts/${COHORT}`;

  describe("PATCH a cohort", () => {
    it("updates it, inside the envelope", async () => {
      cohorts.updateCohort.mockResolvedValue({ id: COHORT, name: "Renamed" });

      const response = await request(server())
        .patch(base)
        .set("authorization", await asAdmin())
        .send({ name: "Renamed" })
        .expect(200);

      expect(asSuccess(response.body)).toMatchObject({
        message: "Cohort updated",
        data: { name: "Renamed" },
      });
    });

    it("refuses a pathway, which cannot change once learners' progress hangs off it", async () => {
      const response = await request(server())
        .patch(base)
        .set("authorization", await asAdmin())
        .send({ name: "Renamed", pathwaySlug: "greenhouse-enterprise" })
        .expect(400);

      expect(asFailure(response.body).error.code).toBe("VALIDATION_FAILED");
      expect(cohorts.updateCohort).not.toHaveBeenCalled();
    });

    it("refuses to clear the name — a cohort keeps one", async () => {
      await request(server())
        .patch(base)
        .set("authorization", await asAdmin())
        .send({ name: null })
        .expect(400);

      expect(cohorts.updateCohort).not.toHaveBeenCalled();
    });

    it("passes null through for the fields that can be cleared", async () => {
      cohorts.updateCohort.mockResolvedValue({});

      await request(server())
        .patch(base)
        .set("authorization", await asAdmin())
        .send({ code: null, endsOn: null })
        .expect(200);

      const [, , , body] = cohorts.updateCohort.mock.calls[0] as [unknown, unknown, unknown, object];
      expect(body).toEqual({ code: null, endsOn: null });
    });
  });

  describe("close, reopen and withdraw", () => {
    it("close and reopen answer with their own messages", async () => {
      cohorts.closeCohort.mockResolvedValue({ status: "COMPLETED" });
      cohorts.reopenCohort.mockResolvedValue({ status: "OPEN" });

      const closed = await request(server())
        .post(`${base}/close`)
        .set("authorization", await asAdmin())
        .expect(200);
      const reopened = await request(server())
        .post(`${base}/reopen`)
        .set("authorization", await asAdmin())
        .expect(200);

      expect(asSuccess(closed.body).message).toBe("Cohort closed");
      expect(asSuccess(reopened.body).message).toBe("Cohort reopened");
    });

    it("withdraws a learner", async () => {
      cohorts.withdraw.mockResolvedValue({ id: ENROLMENT, status: "WITHDRAWN" });

      const response = await request(server())
        .post(`${base}/enrolments/${ENROLMENT}/withdraw`)
        .set("authorization", await asAdmin())
        .expect(200);

      expect(asSuccess(response.body)).toMatchObject({
        message: "Learner withdrawn",
        data: { status: "WITHDRAWN" },
      });
    });

    it("refuses an enrolment id that is not a uuid before reaching the service", async () => {
      await request(server())
        .post(`${base}/enrolments/not-an-id/withdraw`)
        .set("authorization", await asAdmin())
        .expect(400);

      expect(cohorts.withdraw).not.toHaveBeenCalled();
    });

    it("needs a session", async () => {
      await request(server()).post(`${base}/close`).expect(401);

      expect(cohorts.closeCohort).not.toHaveBeenCalled();
    });
  });
});
