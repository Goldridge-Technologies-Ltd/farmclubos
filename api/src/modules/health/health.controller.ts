import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { Public } from "../../common/decorators/public.decorator.js";
import { HealthService } from "./health.service.js";
import type { LivenessResult, ReadinessResult, VersionResult } from "./health.service.js";

// Probes run before anyone signs in: a load balancer has no token.
@Public()
@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @CustomMessage("API is running")
  @ApiOperation({
    summary: "Liveness probe",
    description: "Reports that the API process is running.",
  })
  @ApiResponse({ status: HttpStatus.OK, description: "The process is up." })
  getLiveness(): LivenessResult {
    return this.health.checkLiveness();
  }

  @Get("version")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Version reported")
  @ApiOperation({
    summary: "Deployed version",
    description:
      "The commit and branch this instance was deployed from, so a deployment can be confirmed " +
      "without the hosting dashboards. Null where the host does not say.",
  })
  @ApiResponse({ status: HttpStatus.OK, description: "The deployed commit and branch." })
  getVersion(): VersionResult {
    return this.health.version();
  }

  @Get("ready")
  @HttpCode(HttpStatus.OK)
  // Neutral on purpose: the decorator is static, and data.status may be
  // "degraded", so the message must not claim the API is ready.
  @CustomMessage("Readiness checks completed")
  @ApiOperation({
    summary: "Readiness probe",
    description:
      "Reports whether every dependency the API needs is reachable. Answers 503 when one is not.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Every registered dependency check passed.",
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description:
      "NOT_READY: a dependency is unreachable. `error.details` names which. " +
      "Orchestrators read the status code, so this takes the instance out of rotation.",
  })
  async getReadiness(): Promise<ReadinessResult> {
    const result = await this.health.checkReadiness();

    // The status code is the part a load balancer, Render or Docker reads; a
    // 200 saying "degraded" in its body would keep sending traffic here.
    if (result.status === "degraded") {
      throw new ServiceUnavailableException({
        code: "NOT_READY",
        message: "One or more dependencies are unavailable.",
        details: result.checks,
      });
    }

    return result;
  }
}
