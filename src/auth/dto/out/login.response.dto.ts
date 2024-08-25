import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT generado después de un inicio de sesión exitoso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Mensaje indicando el estado del inicio de sesión',
    example: 'Inicio de sesión exitoso',
  })
  message: string;

  constructor(token: string) {
    this.token = token;
    this.message = 'Inicio de sesión exitoso';
  }
}
