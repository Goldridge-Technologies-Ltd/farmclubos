import type { AddedPlatformAdmin } from "../modules/platform-admins/platform-admins.types.js";
import { readOptions, report } from "./platform-admin-command.js";

describe("readOptions", () => {
  it("takes an email alone, for an account that already exists", () => {
    expect(readOptions(["--email", "ada@example.com"])).toEqual({
      kind: "add",
      input: { email: "ada@example.com" },
    });
  });

  it("takes the names for a new account, trimmed, in either flag style", () => {
    expect(
      readOptions(["--email=ada@example.com", "--first-name", " Ada ", "--last-name=Obi"]),
    ).toEqual({
      kind: "add",
      input: { email: "ada@example.com", firstName: "Ada", lastName: "Obi" },
    });
  });

  it("asks for help with --help or -h", () => {
    expect(readOptions(["--help"])).toEqual({ kind: "help" });
    expect(readOptions(["-h"])).toEqual({ kind: "help" });
  });

  it.each([
    [[], /--email/],
    [["--email", "not an address"], /not an email address/],
    [["--email", "ada@example.com", "--first-name", "Ada"], /both --first-name and --last-name/],
    [["--email", "ada@example.com", "--first-name", "Ada", "--last-name", " "], /both --first-name and --last-name/],
    [["--email", "ada@example.com", "--first-name", "A".repeat(81), "--last-name", "Obi"], /80 characters/],
    [["--email", "ada@example.com", "--password", "secret"], /--password/],
    [["ada@example.com"], /ada@example.com/],
  ])("refuses %j", (args, message) => {
    const command = readOptions(args);

    expect(command.kind).toBe("error");
    expect(command.kind === "error" && command.message).toMatch(message);
  });
});

describe("report", () => {
  const added = (overrides: Partial<AddedPlatformAdmin> = {}): AddedPlatformAdmin => ({
    email: "ada@example.com",
    created: false,
    granted: false,
    reactivated: false,
    passwordLink: null,
    ...overrides,
  });
  const link = (emailStatus: "SENT" | "FAILED") => ({ emailStatus, expiresInDays: 7 });

  it("says a new account was made and emailed its link", () => {
    const text = report(added({ created: true, granted: true, passwordLink: link("SENT") }));

    expect(text).toContain("Made a new account for ada@example.com as a platform administrator.");
    expect(text).toContain("emailed a link to set their password");
    expect(text).toContain("expires in 7 days");
  });

  it("says when the link's email did not send, and to run the command again", () => {
    const text = report(added({ created: true, granted: true, passwordLink: link("FAILED") }));

    expect(text).toContain("did not send");
    expect(text).toContain("run this again");
  });

  it("says an existing account was made an administrator and keeps its password", () => {
    const text = report(added({ granted: true }));

    expect(text).toContain("ada@example.com is now a platform administrator.");
    expect(text).toContain("Its password is unchanged.");
  });

  it("says a deactivated account is active again", () => {
    expect(report(added({ granted: true, reactivated: true }))).toContain("active again");
  });

  it("says when nothing changed", () => {
    expect(report(added())).toBe(
      "ada@example.com is already a platform administrator. Nothing changed.",
    );
  });

  it("says an account still without a password was sent a fresh link", () => {
    const text = report(added({ passwordLink: link("SENT") }));

    expect(text).toContain("has no password yet");
    expect(text).toContain("fresh link");
  });
});
