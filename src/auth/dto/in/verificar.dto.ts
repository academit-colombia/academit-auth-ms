import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerificarDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @IsNotEmpty()
  @ApiProperty({ description: 'Email de la cuenta a verificar', example: 'ana@example.com' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'El código tiene 6 dígitos' })
  @ApiProperty({ description: 'Código recibido por correo', example: '482913' })
  codigo: string;
}

export class ReenviarDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @IsNotEmpty()
  @ApiProperty({ description: 'Email al que reenviar el código', example: 'ana@example.com' })
  email: string;
}
