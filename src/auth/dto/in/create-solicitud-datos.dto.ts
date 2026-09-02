import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Solicitud de cambio de nombre, fecha de nacimiento y/o documento de
 * identidad. Al menos uno de los tres valores propuestos debe venir — lo
 * valida el servicio, no un decorador: class-validator no expresa bien
 * "al menos uno de estos tres campos".
 */
export class CreateSolicitudDatosDto {
  @ApiPropertyOptional({ description: 'Nombre propuesto', example: 'Laura Gómez Restrepo' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombrePropuesto?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento propuesta, formato YYYY-MM-DD',
    example: '1990-05-14',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe tener el formato YYYY-MM-DD' })
  fechaNacimientoPropuesta?: string;

  @ApiPropertyOptional({ description: 'Documento de identidad propuesto', example: '1020304050' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  documentoIdentidadPropuesto?: string;

  @ApiProperty({
    description: 'Motivo del cambio, para que el administrador pueda evaluarlo',
    example: 'Mi documento tenía un error de digitación al registrarme.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Contá un poco más el motivo (mínimo 10 caracteres)' })
  motivo: string;
}
