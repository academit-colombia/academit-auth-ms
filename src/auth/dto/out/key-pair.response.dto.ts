import { ApiProperty } from '@nestjs/swagger';
import { KeyPair } from 'src/auth/entities/key-pair/key-pair';

export class KeyPairResponseDto {
  @ApiProperty({
    description: 'Identificador único del par de claves',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'API key asociada con el par de claves RSA',
    example: 'example-api-key',
  })
  apikey: string;

  @ApiProperty({
    description: 'Clave pública RSA generada',
    example: '-----BEGIN RSA PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0B...',
  })
  publicKey: string;

  @ApiProperty({
    description: 'Indica si la API key está activa o no',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del par de claves',
    example: '2024-08-25T12:34:56.789Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del par de claves',
    example: '2024-08-25T12:34:56.789Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Dirección IP del cliente que creó la API key',
    example: '192.168.1.1',
    nullable: true,
  })
  clientIp?: string;

  @ApiProperty({
    description: 'Contador de intentos fallidos asociados con la API key',
    example: 0,
  })
  failedAttempts: number;

  constructor(keyPair: KeyPair, publicKey: string) {
    this.id = keyPair.id;
    this.apikey = keyPair.apikey;
    this.publicKey = publicKey;
    this.isActive = keyPair.isActive;
    this.createdAt = keyPair.createdAt;
    this.updatedAt = keyPair.updatedAt;
    this.clientIp = keyPair.clientIp;
    this.failedAttempts = keyPair.failedAttempts;
  }
}
