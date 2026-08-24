import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Registro desde la landing.
 *
 * No lleva campo `rol` a propósito: el servicio siempre asigna «estudiante».
 * Si el rol viajara en el cuerpo, cualquiera podría darse de alta como
 * administrador.
 */
export class RegistroDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre completo', example: 'Ana Pérez' })
  nombre: string;

  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @IsNotEmpty()
  @ApiProperty({ description: 'Email con el que iniciará sesión', example: 'ana@example.com' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @ApiProperty({ description: 'Contraseña, mínimo 8 caracteres', example: 'secreta123' })
  password: string;
}
