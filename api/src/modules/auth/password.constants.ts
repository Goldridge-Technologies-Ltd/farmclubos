/*
  Password policy, shared by request validation and the seed.

  Length is the rule, not composition: NIST SP 800-63B recommends a generous
  minimum and no forced mix of character classes. The maximum bounds the work
  Argon2 does on a single request.
*/
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

/*
  Argon2id at OWASP's minimum recommendation: 19 MiB, 2 passes, 1 thread.
  These match @node-rs/argon2's defaults and are written out so a change is a
  deliberate one. The algorithm is left to the library default, Argon2id —
  its `Algorithm` const enum cannot be imported under isolatedModules — and a
  spec asserts the `$argon2id$` prefix.
*/
export const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;
