import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { UsersModule } from '../users/users.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { MetricsModule } from '../observability/metrics.module';
import { SecurityConfigService } from '../common/config/security.config';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    TenancyModule,
    PassportModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const jwtSecret = cfg.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn:
              cfg.get<string>('JWT_ACCESS_EXPIRES_IN') ||
              cfg.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
            issuer: cfg.get<string>('JWT_ISSUER', 'aquafarm-pro'),
            audience: cfg.get<string>('JWT_AUDIENCE', 'aquafarm-users'),
          },
          verifyOptions: {
            issuer: cfg.get<string>('JWT_ISSUER', 'aquafarm-pro'),
            audience: cfg.get<string>('JWT_AUDIENCE', 'aquafarm-users'),
          },
        };
      },
    }),
    MetricsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy, JwtAuthGuard, RolesGuard, PermissionsGuard, SecurityConfigService],
  exports: [AuthService, JwtAuthGuard, RolesGuard, PermissionsGuard],
})
export class AuthModule {}
