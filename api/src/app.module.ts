import { Module, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor.js";
import { validate } from "./config/env.validation.js";
import { HealthModule } from "./modules/health/health.module.js";

@Module({
  imports: [
    /*
      Infrastructure modules are imported once, here. ConfigModule validates the
      environment at boot, so a missing variable stops the process instead of
      surfacing as a runtime failure later.
    */
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate }),
    HealthModule,
  ],
  providers: [
    {
      // Every request body, query and param is validated against its DTO.
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
        }),
    },
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
