/*
  These primitives render on the server and carry no interactivity, so their
  output is what there is to assert: the specs render to static markup rather
  than standing up jsdom and Testing Library. Add those the first time a
  primitive needs an event.

  Only primitives carrying logic are tested — aria wiring, clamping — not
  styling (CONTRIBUTING.md).
*/

/** @type {import('jest').Config} */
const config = {
  rootDir: ".",
  testRegex: ".*\\.spec\\.tsx?$",
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }] },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/"],
};

export default config;
