import { shortCommit, webVersion } from "./version";

/*
  Which commit the web app was deployed from. A wrong fallback would quietly
  report another deployment's version, which is the one thing this is for.
*/
describe("webVersion", () => {
  it("reads the commit, branch and environment Vercel sets on a deployment", () => {
    expect(
      webVersion({ VERCEL_GIT_COMMIT_SHA: "ab8b86b2c4e1", VERCEL_GIT_COMMIT_REF: "main", VERCEL_ENV: "production" }),
    ).toEqual({ commit: "ab8b86b2c4e1", branch: "main", environment: "production" });
  });

  it("prefers GIT_COMMIT and GIT_BRANCH, set by a host of our own", () => {
    expect(
      webVersion({ GIT_COMMIT: "7bf91ec0aa", GIT_BRANCH: "release", VERCEL_GIT_COMMIT_SHA: "ab8b86b2c4e1" }),
    ).toMatchObject({ commit: "7bf91ec0aa", branch: "release" });
  });

  it("reports nothing it does not know, as on a laptop", () => {
    expect(webVersion({ VERCEL_GIT_COMMIT_SHA: "  " })).toEqual({ commit: null, branch: null, environment: null });
  });
});

describe("shortCommit", () => {
  it("shortens a commit to the seven characters GitHub shows", () => {
    expect(shortCommit("ab8b86b2c4e1")).toBe("ab8b86b");
  });
});
