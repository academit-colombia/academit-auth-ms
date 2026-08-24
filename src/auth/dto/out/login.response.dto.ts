import { ApiProperty } from '@nestjs/swagger';
import { UsuarioResponseDto } from './usuario.response.dto';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT con la identidad y el rol del usuario',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({ description: 'Usuario autenticado', type: UsuarioResponseDto })
  usuario: UsuarioResponseDto;

  @ApiProperty({ example: 'Inicio de sesión exitoso' })
  message: string;

  constructor(token: string, usuario: UsuarioResponseDto) {
    this.token = token;
    this.usuario = usuario;
    this.message = 'Inicio de sesión exitoso';
  }
}
