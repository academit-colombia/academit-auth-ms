import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  decrypt(encryptedData: string, privateKey: string): string {
    try {
      return crypto
        .privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PADDING,
          },
          Buffer.from(encryptedData, 'base64'),
        )
        .toString('utf8');
    } catch (error) {
      throw new UnauthorizedException('Failed to decrypt data');
    }
  }
}
