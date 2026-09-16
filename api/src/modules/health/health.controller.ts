import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HealthService } from "./health.service.js";
import type { LivenessResult, ReadinessResult } from "./health.service.js";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
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
