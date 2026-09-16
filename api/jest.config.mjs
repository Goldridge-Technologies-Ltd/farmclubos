/*
  Unit tests. They sit beside their source file as `*.spec.ts` and replace a
  service's dependencies through the testing module rather than touching a real
  database. End-to-end specs live in `test/` and run from `test/jest-e2e.json`
  (see CONTRIBUTING.md).

  NestJS 12 ships ESM only, so the API is an ESM package and ts-jest compiles
  the specs to ESM too. Jest needs --experimental-vm-modules to run them on
  Node 22; the npm scripts pass it.
*/

/** @type {import('jest').Config} */
export default {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  extensionsToTreatAsEsm: [".ts"],
  transform: { "^.+\\.ts$": ["ts-jest", { useESM: true }] },
  // Source imports carry a .js extension that only exists after compilation.
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  // Nest's decorators and class-validator read design-time metadata.
  setupFiles: ["reflect-metadata"],
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
