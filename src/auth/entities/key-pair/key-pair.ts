import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class KeyPair {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'Identificador único del par de claves',
    example: 1,
  })
  id: number;

  @Column()
  @ApiProperty({
    description: 'API key asociada con el par de claves RSA',
    example: 'example-api-key',
  })
  apikey: string;

  @Column('text')
  @ApiProperty({
    description: 'Clave privada RSA generada',
    example: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...',
  })
  privateKey: string;

  @Column({ default: true })
  @ApiProperty({
    description: 'Indica si la API key está activa o no',
    example: true,
  })
  isActive: boolean;

  @CreateDateColumn({ type: 'datetime' })
  @ApiProperty({
    description: 'Fecha de creación del par de claves',
    example: '2024-08-25T12:34:56.789Z',
  })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  @ApiProperty({
    description: 'Fecha de última actualización del par de claves',
    example: '2024-08-25T12:34:56.789Z',
  })
  updatedAt: Date;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Dirección IP del cliente que creó la API key',
    example: '192.168.1.1',
    nullable: true,
  })
  clientIp: string;

  @Column({ default: 0 })
  @ApiProperty({
    description: 'Contador de intentos fallidos asociados con la API key',
    example: 0,
  })
  failedAttempts: number;
}
