import { Injectable } from "@nestjs/common";

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

@Injectable()
export class HealthService {
  /** Is the process up? Used by the container and load-balancer probes. */
  checkLiveness(): LivenessResult {
    return { status: "ok", uptime: Math.floor(process.uptime()) };
  }

  /*
    Can the process serve traffic? Its dependency checks are registered as they
    arrive — the database lands with the Prisma module.
  */
  async checkReadiness(): Promise<ReadinessResult> {
    const checks: Record<string, ReadinessCheck> = {};

    const degraded = Object.values(checks).some((check) => check === "down");

    return Promise.resolve({
      status: degraded ? "degraded" : "ok",
      checks,
    });
  }
}
