import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../lib/database/prisma.service.js";

export type LivenessResult = {
  status: "ok";
  /** Seconds since the process started. Real system data, not a metric. */
  uptime: number;
};

export type ReadinessCheck = "ok" | "down";

export type ReadinessResult = {
  status: "ok" | "degraded";
  checks: Record<string, ReadinessCheck>;
};

/** The deployed commit and its branch, or null where the host does not say. */
export type VersionResult = {
  commit: string | null;
  branch: string | null;
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Is the process up? Used by the container and load-balancer probes. */
  checkLiveness(): LivenessResult {
    return { status: "ok", uptime: Math.floor(process.uptime()) };
  }

  /*
    Can the process serve traffic? Every dependency it cannot work without is
    checked here; more are registered as they arrive.
  */
  async checkReadiness(): Promise<ReadinessResult> {
    const checks: Record<string, ReadinessCheck> = {
      database: (await this.prisma.isReachable()) ? "ok" : "down",
    };

    const degraded = Object.values(checks).some((check) => check === "down");

    return { status: degraded ? "degraded" : "ok", checks };
  }

  /*
    Which commit is running, so a deployment can be confirmed without the
    hosting dashboards. Render sets RENDER_GIT_* on every deploy; a host of our
    own sets GIT_COMMIT and GIT_BRANCH, which win.
  */
  version(): VersionResult {
    return {
      commit: this.setting("GIT_COMMIT") ?? this.setting("RENDER_GIT_COMMIT"),
      branch: this.setting("GIT_BRANCH") ?? this.setting("RENDER_GIT_BRANCH"),
    };
  }

  private setting(key: string): string | null {
    return this.config.get<string>(key)?.trim() || null;
  }
}
