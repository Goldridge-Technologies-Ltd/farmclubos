import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { NodeEnv } from "./config/env.validation.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const nodeEnv = config.getOrThrow<NodeEnv>("NODE_ENV");
  const port = config.getOrThrow<number>("PORT");
  const prefix = config.getOrThrow<string>("API_GLOBAL_PREFIX");

  // Probes stay at the root so a load balancer or container healthcheck does
  // not have to know the API's version prefix.
  app.setGlobalPrefix(prefix, { exclude: ["health", "health/ready"] });

  app.enableCors({
    origin: config
      .getOrThrow<string>("CORS_ORIGINS")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  });

  app.enableShutdownHooks();

  // The browser never loads Swagger in production; it documents a private API.
  if (nodeEnv !== NodeEnv.Production) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("FARMCLUB OS API")
        .setDescription(
          "The FARMCLUB OS backend. Every success is wrapped in " +
            "{ success, data, meta } and every failure in { success, error }.",
        )
        .setVersion("0.1.0")
        .addBearerAuth()
        .build(),
    );

    SwaggerModule.setup(`${prefix}/docs`, app, document);
  }

  await app.listen(port);

  new Logger("Bootstrap").log(
    `FARMCLUB OS API listening on http://localhost:${port}/${prefix}`,
  );
}

void bootstrap();
