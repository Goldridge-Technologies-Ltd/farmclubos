/*
  Refuses to commit a credential.

  A real secret reached a committed .env.example once, because the file that is
  meant to hold placeholders was filled in with working values. This checks
  every staged file for the shapes a leak actually takes:

    - an assignment whose name says secret, password, token or key, with a
      value that is not obviously a placeholder;
    - a private key block;
    - a high-entropy value in a .env* file, whatever the key is called.

  Run by lint-staged, which passes the staged paths. A deliberate exception —
  a fixture, say — is allowed with a trailing "allowlist secret" comment.
*/
import { readFileSync, statSync } from "node:fs";

const SECRET_ASSIGNMENT =
  /^\s*(?:export\s+)?(?:const\s+|let\s+|var\s+|readonly\s+|static\s+)*([A-Za-z0-9_]*(?:SECRET|PASSWORD|PASSWD|TOKEN|PRIVATE[_-]?KEY|API[_-]?KEY|ACCESS[_-]?KEY|CREDENTIAL)[A-Za-z0-9_]*)\s*[:=]\s*(.*)$/i;

/** A quoted string: in code, only a literal can be the secret itself. */
const QUOTED = /^(['"`]).*\1$/;

const PRIVATE_KEY_BLOCK = /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/;

/** 32+ characters of base64, or 40+ hex: long enough to be a real key. */
const HIGH_ENTROPY = /(?:[A-Za-z0-9+/]{32,}={0,2}|\b[0-9a-f]{40,}\b)/;

const ALLOWLISTED = /allowlist secret/i;

/** A number or a flag is a setting, never a credential: TTLs, ports, sizes. */
const NOT_A_SECRET_VALUE = /^(?:\d+|true|false)$/i;

/** Values that are clearly stand-ins rather than credentials. */
const PLACEHOLDER =
  /^(?:|<.*>|\$\{.*\}|\$[A-Z_]+|your[-_ ].*|my[-_ ].*|change[-_ ]?me|replace[-_ ]?me|todo|test|secret|password|x{3,}|\.{3}|example.*|placeholder.*|dummy.*|sample.*)$/i;

const MAX_BYTES = 512 * 1024;

/** The value with any trailing comment and statement punctuation removed. */
function normalise(value) {
  return value
    .replace(/\s+(?:\/\/|#).*$/, "")
    .trim()
    .replace(/[;,]+$/, "")
    .trim();
}

/** The value inside its quotes, if it has any. */
function unquote(value) {
  const quoted = /^(['"`])(.*)\1$/.exec(normalise(value));

  return (quoted ? quoted[2] : normalise(value)).trim();
}

function findings(path) {
  let contents;

  try {
    if (statSync(path).size > MAX_BYTES) return [];
    contents = readFileSync(path, "utf8");
  } catch {
    // Deleted or unreadable: nothing to inspect.
    return [];
  }

  // A NUL byte means binary, whatever the extension says.
  if (contents.includes("\0")) return [];

  const isEnvFile = /(^|\/)\.env(\.|$)/.test(path);
  const found = [];

  contents.split("\n").forEach((line, index) => {
    if (ALLOWLISTED.test(line) || line.trim().startsWith("#")) return;

    const assignment = SECRET_ASSIGNMENT.exec(line);

    if (assignment) {
      const [, name, rawValue] = assignment;
      const bare = normalise(rawValue);
      const value = unquote(bare);

      /*
        A .env file should never hold a value at all, so any real one is wrong.

        Code is judged only on entropy: a readable constant like
        "test-access-secret-that-is-long-enough" is an ordinary test fixture,
        while a base64 or hex blob is a credential. The value must also be a
        quoted literal — `= process.env.X` is a lookup, not a secret.
      */
      const suspect = isEnvFile
        ? true
        : HIGH_ENTROPY.test(value) && !/[()]/.test(value);

      if (suspect && !PLACEHOLDER.test(value) && !NOT_A_SECRET_VALUE.test(value)) {
        found.push({ line: index + 1, reason: name + " has a real-looking value" });
        return;
      }
    }

    if (PRIVATE_KEY_BLOCK.test(line)) {
      found.push({ line: index + 1, reason: "a private key block" });
      return;
    }

    if (isEnvFile) {
      const value = unquote(line.split(/[:=]/).slice(1).join("="));

      if (HIGH_ENTROPY.test(value)) {
        found.push({ line: index + 1, reason: "a high-entropy value" });
      }
    }
  });

  return found;
}

const leaks = process.argv
  .slice(2)
  .flatMap((path) => findings(path).map((finding) => ({ path, ...finding })));

if (leaks.length > 0) {
  // The value itself is never printed: it would land in the terminal scrollback.
  console.error("\nThis commit looks like it contains a credential:\n");

  for (const leak of leaks) {
    console.error("  " + leak.path + ":" + leak.line + " - " + leak.reason);
  }

  console.error(
    [
      "",
      "Nothing secret belongs in a tracked file. Keep real values in api/.env,",
      "which is gitignored, and leave the example file's value empty:",
      "",
      "  JWT_ACCESS_SECRET=",
      "",
      "If this is genuinely not a credential, add a trailing 'allowlist secret'",
      "comment to that line. Do not bypass the hook with --no-verify.",
      "",
    ].join("\n"),
  );

  process.exit(1);
}
