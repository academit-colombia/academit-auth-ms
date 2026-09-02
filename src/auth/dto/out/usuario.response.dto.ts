import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneroUsuario, RolUsuario } from '../../roles.enum';
import { Usuario } from '../../entities/usuario/usuario.entity';

/** Vista pública de un usuario: nunca incluye el hash de la contraseña. */
export class UsuarioResponseDto {
  @ApiProperty({ example: 1 })
  idUsuario: number;

  @ApiProperty({ example: 'Laura Gómez' })
  nombre: string;

  @ApiProperty({ example: 'laura@academit.com.co' })
  email: string;

  @ApiProperty({ enum: RolUsuario })
  rol: RolUsuario;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  telefono: string | null;

  @ApiPropertyOptional({ example: '1990-05-14' })
  fechaNacimiento: string | null;

  @ApiPropertyOptional({ example: 'CO', description: 'ISO 3166-1 alfa-2' })
  paisResidencia: string | null;

  @ApiPropertyOptional({ example: 'Bogotá' })
  ciudad: string | null;

  @ApiPropertyOptional({ example: '1020304050' })
  documentoIdentidad: string | null;

  @ApiPropertyOptional({ example: 'Calle 10 # 20-30' })
  direccion: string | null;

  @ApiPropertyOptional({ example: '110111' })
  codigoPostal: string | null;

  @ApiPropertyOptional({ enum: GeneroUsuario })
  genero: GeneroUsuario | null;

  @ApiPropertyOptional({ example: 'Ingeniera de software…' })
  biografia: string | null;

  @ApiPropertyOptional({
    example: 'uploads/usuarios/1712345678-foto.png',
    description: 'Ruta relativa; el servicio la sirve bajo /uploads/',
  })
  rutaFoto: string | null;

  @ApiProperty({ example: '2026-08-23T12:00:00.000Z' })
  createdAt: Date;

  constructor(usuario: Usuario) {
    this.idUsuario = usuario.idUsuario;
    this.nombre = usuario.nombre;
    this.email = usuario.email;
    this.rol = usuario.rol;
    this.activo = usuario.activo;
    this.telefono = usuario.telefono ?? null;
    this.fechaNacimiento = usuario.fechaNacimiento ?? null;
    this.paisResidencia = usuario.paisResidencia ?? null;
    this.ciudad = usuario.ciudad ?? null;
    this.documentoIdentidad = usuario.documentoIdentidad ?? null;
    this.direccion = usuario.direccion ?? null;
    this.codigoPostal = usuario.codigoPostal ?? null;
    this.genero = usuario.genero ?? null;
    this.biografia = usuario.biografia ?? null;
    this.rutaFoto = usuario.rutaFoto ?? null;
    this.createdAt = usuario.createdAt;
  }
}
