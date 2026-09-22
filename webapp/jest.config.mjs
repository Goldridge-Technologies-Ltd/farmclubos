/*
  Web app tests, run sparingly (CONTRIBUTING.md): logic that can break silently
  — the API client's unwrapping and error mapping, cookie lifetimes — not
  markup or wiring. React Testing Library joins when the first case needs it.

  ESM, like the API's, because the source is ESM and Next resolves it that way.
*/

/** @type {import('jest').Config} */
const config = {
  rootDir: ".",
  testEnvironment: "node",
  testRegex: "src/.*\\.spec\\.tsx?$",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: { "^.+\\.tsx?$": ["ts-jest", { useESM: true }] },
  moduleNameMapper: {
    "^server-only$": "<rootDir>/src/testing/server-only.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
};

export default config;
