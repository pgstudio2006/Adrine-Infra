import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MfaService } from './mfa.service';
import type { JwtPayload } from './jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly mfa: MfaService,
  ) {}

  @Post('dev-login')
  devLogin(
    @Body()
    body: {
      email: string;
      fullName: string;
      role: string;
      tenantId?: string;
      branchId?: string;
    },
  ) {
    return this.auth.devLogin(body);
  }

  @Post('dev-token')
  devToken(@Body() body: { sub?: string }) {
    return {
      message: 'Use POST /auth/dev-login for a signed JWT with tenant and branch claims.',
      sub: body.sub ?? 'dev-user',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@Req() req: Request & { user?: JwtPayload }) {
    return { user: req.user ?? null };
  }

  @Post('mfa/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  mfaEnroll(@Req() req: Request & { user?: JwtPayload }) {
    const user = req.user!;
    return this.mfa.enroll(user.sub, user.tenantId ?? 'tenant_dev');
  }

  @Post('mfa/verify')
  mfaVerify(@Body() body: { challengeId: string; code: string }) {
    return this.mfa.verify(body.challengeId, body.code);
  }

  @Post('sessions/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  revokeSession(
    @Req() req: Request & { user?: JwtPayload },
    @Body() body: { sessionId?: string },
  ) {
    return this.auth.revokeSession(req.user!, body.sessionId);
  }
}
