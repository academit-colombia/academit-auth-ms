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
import { EncryptionService } from './encryption/encryption.service';
import { KeyPair } from './entities/key-pair/key-pair';
import { generateKeyPairSync } from 'crypto';
import { KeyPairResponseDto } from './dto/out/key-pair.response.dto';
import { LoginResponseDto } from './dto/out/login.response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private encryptionService: EncryptionService,
    @InjectRepository(KeyPair)
    private keyPairRepository: Repository<KeyPair>,
  ) {}

  async login(
    apikey: string,
    encryptedUsername: string,
    encryptedPassword: string,
  ): Promise<LoginResponseDto> {
    this.logger.debug(`Intentando iniciar sesión con la API key: ${apikey}`);

    const keyPair = await this.keyPairRepository.findOne({ where: { apikey } });

    if (!keyPair || !keyPair.isActive) {
      this.logger.warn(
        `Intento de inicio de sesión fallido: API key inválida o inactiva: ${apikey}`,
      );
      throw new UnauthorizedException('API key inválida o inactiva');
    }

    try {
      this.logger.debug(`Clave privada utilizada: ${keyPair.privateKey}`);

      const username = this.encryptionService.decrypt(
        encryptedUsername,
        keyPair.privateKey,
      );
      const password = this.encryptionService.decrypt(
        encryptedPassword,
        keyPair.privateKey,
      );

      this.logger.log(
        `Inicio de sesión exitoso para la API key: ${apikey}, usuario: ${username}`,
      );

      const payload = { apikey, username };
      const token = this.jwtService.sign(payload);
      return new LoginResponseDto(token);
    } catch (error) {
      this.logger.error(`Error en login: ${error.message}`);
      if (error instanceof UnauthorizedException) {
        this.logger.warn(`Credenciales incorrectas para la API key: ${apikey}`);
        throw error;
      } else {
        this.logger.error(
          `Error interno al procesar la autenticación para la API key: ${apikey}`,
          error.stack,
        );
        await this.handleFailedAttempt(keyPair);
        throw new InternalServerErrorException(
          'Error al procesar la autenticación',
        );
      }
    }
  }

  async signup(apikey: string): Promise<LoginResponseDto> {
    this.logger.debug(
      `Intentando registrar un nuevo usuario con la API key: ${apikey}`,
    );
    try {
      return this.login(apikey, '', '');
    } catch (error) {
      this.logger.error(
        `Error durante el proceso de registro con la API key: ${apikey}`,
        error.stack,
      );
      throw new BadRequestException('Error durante el proceso de registro');
    }
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

  private async handleFailedAttempt(keyPair: KeyPair): Promise<void> {
    keyPair.failedAttempts += 1;
    this.logger.warn(
      `Intento fallido incrementado para la API key: ${keyPair.apikey}, total de intentos: ${keyPair.failedAttempts}`,
    );

    if (keyPair.failedAttempts >= 3) {
      keyPair.isActive = false;
      this.logger.warn(
        `La API key: ${keyPair.apikey} ha sido desactivada después de 3 intentos fallidos`,
      );
    }

    try {
      await this.keyPairRepository.save(keyPair);
    } catch (error) {
      this.logger.error(
        `Error al actualizar los intentos fallidos para la API key: ${keyPair.apikey}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error al actualizar el estado de la API key',
      );
    }
  }
}
