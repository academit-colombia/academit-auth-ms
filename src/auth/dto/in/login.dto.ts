import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @IsNotEmpty()
  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@academit.com.co',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Contraseña del usuario', example: 'secreta123' })
  password: string;
}
