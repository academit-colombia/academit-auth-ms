import {
  IsDateString,
  IsEnum,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GeneroUsuario } from '../../roles.enum';

/**
 * Datos personales que puede mantener el propio usuario.
 *
 * Todos opcionales: la cuenta se crea con lo mínimo y el perfil se completa
 * después. Deliberadamente NO incluye `rol` ni `activo`: eso son permisos, no
 * datos personales, y solo los toca un administrador.
 */
export class DatosPersonalesDto {
  @ApiPropertyOptional({ description: 'Nombre completo', example: 'Laura Gómez' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento en formato YYYY-MM-DD',
    example: '1990-05-14',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe tener el formato YYYY-MM-DD' })
  fechaNacimiento?: string;

  @ApiPropertyOptional({
    description: 'País de residencia, código ISO 3166-1 alfa-2',
    example: 'CO',
  })
  @IsOptional()
  @IsISO31661Alpha2({ message: 'El país debe ser un código ISO de dos letras (CO, ES, MX…)' })
  paisResidencia?: string;

  @ApiPropertyOptional({ description: 'Ciudad de residencia', example: 'Bogotá' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ciudad?: string;

  @ApiPropertyOptional({ description: 'Documento de identidad', example: '1020304050' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  documentoIdentidad?: string;

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

  @ApiPropertyOptional({ description: 'Género', enum: GeneroUsuario })
  @IsOptional()
  @IsEnum(GeneroUsuario, { message: 'Género inválido' })
  genero?: GeneroUsuario;

  @ApiPropertyOptional({
    description: 'Presentación breve; para un profesor acompaña a sus cursos',
    example: 'Ingeniera de software con 10 años enseñando desarrollo web.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  biografia?: string;

  @ApiPropertyOptional({
    description: 'Fotografía de perfil (JPG, PNG, WEBP o GIF, máx. 5 MB)',
    type: 'string',
    format: 'binary',
  })
  fotografia?: any;
}
