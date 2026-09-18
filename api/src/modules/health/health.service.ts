import { Injectable } from "@nestjs/common";
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

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

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
}
