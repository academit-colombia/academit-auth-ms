import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { KeyPair } from './entities/key-pair/key-pair';
import { EncryptionService } from './encryption/encryption.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([KeyPair])],
  providers: [JwtService, AuthService, EncryptionService],
  controllers: [AuthController],
})
export class AuthModule {}
