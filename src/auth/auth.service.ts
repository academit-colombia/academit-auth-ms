import {
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuariosService } from './usuarios.service';
import { JwtPayload } from './roles.enum';
import { UsuarioResponseDto } from './dto/out/usuario.response.dto';
import { Usuario } from './entities/usuario/usuario.entity';
import { KeyPair } from './entities/key-pair/key-pair';
import { generateKeyPairSync } from 'crypto';
import { KeyPairResponseDto } from './dto/out/key-pair.response.dto';
import { LoginResponseDto } from './dto/out/login.response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private usuariosService: UsuariosService,
    @InjectRepository(KeyPair)
    private keyPairRepository: Repository<KeyPair>,
  ) {}

  /**
   * Valida email y contraseña contra la tabla de usuarios y emite un JWT que
   * lleva el rol. Ese token es el que `griselda-backend` verifica con el mismo
   * `JWT_SECRET` para autorizar sus endpoints.
   */
  async login(email: string, password: string): Promise<LoginResponseDto> {
    this.logger.debug(`Intento de inicio de sesión para: ${email}`);

    const usuario = await this.usuariosService.validarCredenciales(
      email,
      password,
    );

    const payload: JwtPayload = {
      sub: usuario.idUsuario,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };

    this.logger.log(
      `Inicio de sesión exitoso: ${usuario.email} (rol ${usuario.rol})`,
    );

    return this.emitirSesion(usuario);
  }

  /**
   * Emite la sesión de un usuario ya autenticado por otra vía.
   *
   * Lo usa la verificación por código: quien acaba de confirmar su email ya
   * demostró quién es, así que volver a pedirle la contraseña sobra.
   */
  emitirSesion(usuario: Usuario): LoginResponseDto {
    const payload: JwtPayload = {
      sub: usuario.idUsuario,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };

    return new LoginResponseDto(
      this.jwtService.sign(payload),
      new UsuarioResponseDto(usuario),
    );
  }

  async createKeyPair(apikey: string): Promise<KeyPairResponseDto> {
    this.logger.debug(`Generando par de claves RSA para la API key: ${apikey}`);

    try {
      const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'pkcs1',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs1',
          format: 'pem',
        },
      });

      const keyPair = this.keyPairRepository.create({
        apikey,
        privateKey,
        isActive: true,
        failedAttempts: 0,
      });

      const savedKeyPair = await this.keyPairRepository.save(keyPair);
      this.logger.log(
        `Par de claves RSA creado exitosamente para la API key: ${apikey}`,
      );

      return new KeyPairResponseDto(savedKeyPair, publicKey);
    } catch (error) {
      this.logger.error(
        `Error al generar par de claves para la API key: ${apikey}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error al generar el par de claves RSA',
      );
    }
  }
}
