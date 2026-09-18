import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

/*
  Prisma 7 has no query engine of its own: the connection is made by a driver
  adapter, which we build from ConfigService rather than from process.env.

  Extending PrismaClient is how the NestJS recipe satisfies the "never
  instantiate a service yourself" rule — the client *is* the injectable
  service, constructed once by Nest's container.
*/
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: config.getOrThrow<string>("DATABASE_URL"),
        max: config.get<number>("DATABASE_POOL_MAX", 10),
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Database connection established");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** A cheap round trip, for the readiness probe. */
  async isReachable(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error(
        "Database readiness check failed",
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }
}
