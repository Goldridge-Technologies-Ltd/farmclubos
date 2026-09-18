import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ACCESS_TOKEN_ALGORITHM } from "../../common/auth/access-token.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { PasswordService } from "./password.service.js";
import { TokenService } from "./token.service.js";

@Module({
  imports: [
    // Global so the app-wide JwtAuthGuard in src/common can verify tokens.
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        signOptions: { algorithm: ACCESS_TOKEN_ALGORITHM },
        verifyOptions: { algorithms: [ACCESS_TOKEN_ALGORITHM] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService],
  // Invites start a session on acceptance; users change passwords.
  exports: [AuthService, PasswordService, TokenService],
})
export class AuthModule {}
