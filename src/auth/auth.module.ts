import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { KeyPair } from './entities/key-pair/key-pair';
import { EncryptionService } from './encryption/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeyPair]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
        },
      }),
    }),
  ],
  providers: [AuthService, EncryptionService],
  controllers: [AuthController],
})
export class AuthModule {}
