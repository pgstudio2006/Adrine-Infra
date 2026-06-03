import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController, PublicTenantController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { MfaService } from './mfa.service';
import { PhiSafeLoggerInterceptor } from './phi-safe-logger.interceptor';
import { resolveJwtSecret } from './jwt-secret';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController, PublicTenantController],
  providers: [
    JwtStrategy,
    AuthService,
    MfaService,
    { provide: APP_INTERCEPTOR, useClass: PhiSafeLoggerInterceptor },
  ],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
