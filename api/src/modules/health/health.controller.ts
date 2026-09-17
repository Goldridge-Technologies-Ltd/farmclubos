import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { Public } from "../../common/decorators/public.decorator.js";
import { HealthService } from "./health.service.js";
import type { LivenessResult, ReadinessResult } from "./health.service.js";

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

  @Get("ready")
  @HttpCode(HttpStatus.OK)
  // Neutral on purpose: the decorator is static, and data.status may be
  // "degraded", so the message must not claim the API is ready.
  @CustomMessage("Readiness checks completed")
  @ApiOperation({
    summary: "Readiness probe",
    description: "Reports whether every dependency the API needs is reachable.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Every registered dependency check passed.",
  })
  getReadiness(): Promise<ReadinessResult> {
    return this.health.checkReadiness();
  }
}
