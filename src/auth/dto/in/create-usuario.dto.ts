import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolUsuario } from '../../roles.enum';
import { DatosPersonalesDto } from './datos-personales.dto';

/** Alta de un usuario. Solo lo hace un administrador. */
export class CreateUsuarioDto extends DatosPersonalesDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre completo', example: 'Laura Gómez' })
  nombre: string;

  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @IsNotEmpty()
  @ApiProperty({
    description: 'Email, único en el sistema. No se puede cambiar después.',
    example: 'laura@academit.com.co',
  })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @ApiProperty({
    description: 'Contraseña en claro; se guarda con hash bcrypt',
    example: 'secreta123',
  })
  password: string;

  @IsEnum(RolUsuario, { message: 'Rol inválido' })
  @ApiProperty({ description: 'Rol asignado', enum: RolUsuario })
  rol: RolUsuario;
}
