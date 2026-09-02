import {
  IsDateString,
  IsEmail,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Registro desde la landing.
 *
 * No lleva campo `rol` a propósito: el servicio siempre asigna «estudiante».
 * Si el rol viajara en el cuerpo, cualquiera podría darse de alta como
 * administrador.
 *
 * Los datos de identificación (teléfono, documento, fecha de nacimiento,
 * país, ciudad) son obligatorios acá aunque son opcionales en
 * `DatosPersonalesDto`: el registro es el único momento en que se le puede
 * exigir esta información al cliente antes de tener una cuenta.
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

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @ApiProperty({ description: 'Teléfono de contacto', example: '+57 300 123 4567' })
  telefono: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  @ApiProperty({ description: 'Documento de identidad', example: '1020304050' })
  documentoIdentidad: string;

  @IsDateString({}, { message: 'La fecha de nacimiento debe tener el formato YYYY-MM-DD' })
  @ApiProperty({
    description: 'Fecha de nacimiento en formato YYYY-MM-DD',
    example: '1990-05-14',
  })
  fechaNacimiento: string;

  @IsISO31661Alpha2({ message: 'El país debe ser un código ISO de dos letras (CO, ES, MX…)' })
  @ApiProperty({
    description: 'País de residencia, código ISO 3166-1 alfa-2',
    example: 'CO',
  })
  paisResidencia: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @ApiProperty({ description: 'Ciudad de residencia', example: 'Bogotá' })
  ciudad: string;

  @ApiPropertyOptional({ description: 'Dirección de residencia', example: 'Calle 10 # 20-30' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({ description: 'Código postal', example: '110111' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigoPostal?: string;
}
