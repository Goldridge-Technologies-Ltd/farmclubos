import { ApiError, isMissingRecord } from "./errors";

/*
  Whether a failed read means "there is nothing here", which a screen shows as
  not-found, rather than "something broke", which it shows as an error to
  retry. A malformed id in the URL is the first kind: retrying will not help.
*/
describe("isMissingRecord", () => {
  it("is true for a 404", () => {
    expect(isMissingRecord(new ApiError(404, "NOT_FOUND", "No."))).toBe(true);
  });

  it("is true for an id the API would not even parse", () => {
    expect(isMissingRecord(new ApiError(400, "VALIDATION_FAILED", "Bad id."))).toBe(true);
  });

  it("is false for anything that retrying might fix", () => {
    expect(isMissingRecord(new ApiError(503, "SERVICE_UNAVAILABLE", "Down."))).toBe(false);
    expect(isMissingRecord(new ApiError(401, "AUTHENTICATION_REQUIRED", "Who?"))).toBe(false);
    expect(isMissingRecord(new Error("network"))).toBe(false);
  });
});
