import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import UsersModule from 'src/admin/users/users.module';
import { envConfig } from 'unicore-common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GravitModule } from './gravit/gravit.module';
import { AuthController } from './auth.controller';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokensService } from './tokens.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiModule } from 'src/admin/api/api.module';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { EmailModule } from 'src/admin/email/email.module';

@Module({
  imports: [
    UsersModule,
    ApiModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([RefreshToken, User]),
    JwtModule.register({
      secret: envConfig.jwtKey,
      signOptions: { expiresIn: envConfig.jwtExpires },
    }),
    GravitModule,
  ],
  providers: [
    AuthService,
    TokensService,
    ApiKeyStrategy,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, TokensService],
  controllers: [AuthController],
})
export class AuthModule {}
