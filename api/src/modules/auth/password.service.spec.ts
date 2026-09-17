import { PasswordService } from "./password.service.js";

describe("PasswordService", () => {
  const passwords = new PasswordService();

  it("hashes with Argon2id, never storing the password itself", async () => {
    const hash = await passwords.hash("correct horse battery");

    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(hash).not.toContain("correct horse battery");
  });

  it("salts each hash, so the same password hashes differently", async () => {
    const [first, second] = await Promise.all([
      passwords.hash("correct horse battery"),
      passwords.hash("correct horse battery"),
    ]);

    expect(first).not.toBe(second);
  });

  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await passwords.hash("correct horse battery");

    await expect(passwords.verify(hash, "correct horse battery")).resolves.toBe(true);
    await expect(passwords.verify(hash, "wrong horse battery")).resolves.toBe(false);
  });

  it("treats a malformed stored hash as a failed match rather than an error", async () => {
    await expect(passwords.verify("not-a-hash", "anything")).resolves.toBe(false);
  });

  it("spends real work verifying for an unknown account, so timing reveals nothing", async () => {
    const started = performance.now();
    await expect(passwords.verifyAgainstDummy("anything")).resolves.toBe(false);

    // A real Argon2 verify, not an early return: it takes measurable time.
    expect(performance.now() - started).toBeGreaterThan(5);
  });
});
