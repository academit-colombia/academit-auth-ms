import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfigUsuarios } from '../multer.config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { InternoController } from './interno.controller';
import { PublicoController } from './publico.controller';
import { KeyPair } from './entities/key-pair/key-pair';
import { Usuario } from './entities/usuario/usuario.entity';
import { CodigoVerificacion } from './entities/codigo/codigo-verificacion.entity';
import { VerificacionService } from './verificacion.service';
import { CorreoService } from './correo/correo.service';
import { EncryptionService } from './encryption/encryption.service';
import { JwtStrategy } from './jwt.strategy';
import { InternoGuard } from './guards/interno.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeyPair, Usuario, CodigoVerificacion]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.register(multerConfigUsuarios),
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
  providers: [
    AuthService,
    UsuariosService,
    VerificacionService,
    CorreoService,
    EncryptionService,
    JwtStrategy,
    InternoGuard,
  ],
  controllers: [
    AuthController,
    UsuariosController,
    InternoController,
    PublicoController,
  ],
})
export class AuthModule {}
