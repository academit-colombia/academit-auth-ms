import { IsString, IsNotEmpty, IsBase64 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'API key asociada con el usuario',
    example: 'example-api-key',
  })
  apikey: string;

  @IsBase64()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Nombre de usuario encriptado en Base64',
    example: 'QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
  })
  encryptedUsername: string;

  @IsBase64()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Contraseña encriptada en Base64',
    example: 'QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
  })
  encryptedPassword: string;
}
