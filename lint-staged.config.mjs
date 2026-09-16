/*
  Pre-commit checks, per workspace. Each entry runs that workspace's own lint,
  type-check and test scripts when it has staged changes, so a commit only
  pays for what it touched.

  The commands are functions so lint-staged does not append the staged
  filenames: these scripts check the whole workspace, which is what the app
  configs (eslint, tsconfig, jest) are set up for.
*/
const checks = (workspace) => () =>
  `node scripts/workspace-checks.mjs ${workspace}`;

export default {
  "site/**/*.{ts,tsx,css}": checks("site"),
  "webapp/**/*.{ts,tsx,css}": checks("webapp"),
  "api/**/*.ts": checks("api"),
  "packages/design-system/**/*.{ts,tsx,css}": checks("packages/design-system"),
};
