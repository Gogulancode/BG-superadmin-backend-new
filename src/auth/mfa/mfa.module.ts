import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import { MfaService } from './mfa.service';
import { MfaController } from './mfa.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { requireJwtSecret } from '../../config/env';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register(),
    JwtModule.register({
      secret: requireJwtSecret(),
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [MfaController],
  providers: [MfaService],
  exports: [MfaService],
})
export class MfaModule {}
