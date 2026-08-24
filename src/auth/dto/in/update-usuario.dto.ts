import { IsBooleanString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario } from '../../roles.enum';
import { DatosPersonalesDto } from './datos-personales.dto';

/**
 * Edición desde la sección Usuarios: datos personales más lo que solo un
 * administrador puede tocar (rol, estado de la cuenta y contraseña).
 */
export class UpdateUsuarioDto extends DatosPersonalesDto {
  @IsOptional()
  @IsEnum(RolUsuario, { message: 'Rol inválido' })
  @ApiPropertyOptional({ description: 'Rol asignado', enum: RolUsuario })
  rol?: RolUsuario;

  // Llega como texto porque el formulario viaja en multipart, donde todo
  // valor es cadena; el servicio lo convierte.
  @IsOptional()
  @IsBooleanString({ message: 'El estado debe ser "true" o "false"' })
  @ApiPropertyOptional({
    description: 'Un usuario inactivo no puede iniciar sesión',
    enum: ['true', 'false'],
  })
  activo?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @ApiPropertyOptional({ description: 'Nueva contraseña; si se omite, no se cambia' })
  password?: string;
}
