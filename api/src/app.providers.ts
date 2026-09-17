import { ValidationPipe, type Provider } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard.js";
import { RolesGuard } from "./common/guards/roles.guard.js";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor.js";

/**
 * The request pipeline every route runs through. Shared by AppModule and the
 * end-to-end specs, so the specs test the real configuration rather than a copy
 * of it.
 */
export const globalProviders: Provider[] = [
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
  /*
    Secure by default: every route needs a valid access token unless it is
    @Public(), then role metadata is checked. Guards run in this order.
  */
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
  { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
  { provide: APP_FILTER, useClass: AllExceptionsFilter },
];
