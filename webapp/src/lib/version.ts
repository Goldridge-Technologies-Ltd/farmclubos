import "server-only";

export type DeployedVersion = {
  commit: string | null;
  branch: string | null;
  /** Vercel's: production, preview or development. */
  environment: string | null;
};

/**
 * The commit this web app was deployed from. Vercel sets its VERCEL_GIT_*
 * variables on every deployment, while the project exposes its system
 * environment variables; any other host sets GIT_COMMIT and GIT_BRANCH,
 * which win. Null where nothing says, as in local development.
 */
export function webVersion(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): DeployedVersion {
  const read = (key: string) => env[key]?.trim() || null;

  return {
    commit: read("GIT_COMMIT") ?? read("VERCEL_GIT_COMMIT_SHA"),
    branch: read("GIT_BRANCH") ?? read("VERCEL_GIT_COMMIT_REF"),
    environment: read("VERCEL_ENV"),
  };
}

/** The first seven characters, as GitHub shows a commit. */
export function shortCommit(commit: string): string {
  return commit.slice(0, 7);
}
