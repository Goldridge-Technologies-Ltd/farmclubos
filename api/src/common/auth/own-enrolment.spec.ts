import { ownEnrolment } from "./own-enrolment.js";

/*
  The access token names an institution but can be up to fifteen minutes old.
  Without this condition, someone removed from an institution could keep
  completing lessons and submitting quizzes there until their token expired.
*/
describe("ownEnrolment", () => {
  const where = ownEnrolment("user-1", "institution-1");

  it("is the caller's own enrolment, in the institution the token names", () => {
    expect(where).toMatchObject({ userId: "user-1", institutionId: "institution-1" });
  });

  it("requires them to still be an active member there, per the database", () => {
    expect(where.user).toEqual({
      memberships: { some: { institutionId: "institution-1", status: "ACTIVE" } },
    });
  });

  it("requires the institution itself to still be active", () => {
    expect(where.institution).toEqual({ status: "ACTIVE", archivedAt: null });
  });
});
