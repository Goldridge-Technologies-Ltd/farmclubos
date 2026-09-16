/*
  Runs a workspace's own lint, type-check and test scripts. Called by
  lint-staged (see lint-staged.config.mjs) for each workspace with staged
  changes, so a commit only checks what it touched.

  A workspace that does not exist yet, or that does not define one of the
  scripts, is skipped rather than failing the commit.
*/
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const workspace = process.argv[2];

if (!workspace) {
  console.error("Usage: node scripts/workspace-checks.mjs <workspace>");
  process.exit(1);
}

const manifest = join(workspace, "package.json");

if (!existsSync(manifest)) {
  console.log(`Skipping ${workspace}: not a workspace yet.`);
  process.exit(0);
}

const { scripts = {} } = JSON.parse(readFileSync(manifest, "utf8"));

for (const script of ["lint", "type-check", "test"]) {
  if (!scripts[script]) continue;

  console.log(`\n${workspace}: npm run ${script}`);

  const result = spawnSync(
    "npm",
    ["run", script, "--workspace", workspace],
    { stdio: "inherit" },
  );

  if (result.status !== 0) process.exit(result.status ?? 1);
}
