import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditModule } from '../audit/audit.module';
import { MfaModule } from './mfa/mfa.module';
import { MfaService } from './mfa/mfa.service';
import { MfaController } from './mfa/mfa.controller';
import { SessionModule } from './sessions/session.module';
import { SessionService } from './sessions/session.service';
import { SessionController } from './sessions/session.controller';
import { PasswordPolicyService } from './services/password-policy.service';
import { requireJwtSecret } from '../config/env';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    PassportModule,
    CacheModule.register(),
    JwtModule.register({
      secret: requireJwtSecret(),
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController, MfaController, SessionController],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    JwtAuthGuard,
    MfaService,
    SessionService,
    PasswordPolicyService,
  ],
  exports: [JwtModule, JwtStrategy, RolesGuard, JwtAuthGuard, MfaService, SessionService, PasswordPolicyService],
})
export class AuthModule {}
