import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);

  decrypt(encryptedData: string, privateKey: string): string {
    this.logger.debug('Iniciando el proceso de desencriptación.');

    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      this.logger.debug('Buffer creado a partir de los datos encriptados.');

      const decrypted = crypto.privateDecrypt(privateKey, buffer);

      const decryptedString = decrypted.toString('utf8');
      this.logger.debug(`Resultado desencriptado: ${decryptedString}`);

      return decryptedString;
    } catch (error) {
      this.logger.error(
        'Error durante el proceso de desencriptación',
        error.stack,
      );
      throw new UnauthorizedException('No se pudo desencriptar los datos');
    }
  }
}
