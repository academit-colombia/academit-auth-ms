import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Usuario } from '../../entities/usuario/usuario.entity';

/**
 * Ficha pública de un profesor, para mostrarla junto a sus cursos.
 *
 * Incluye SOLO lo que tiene sentido enseñar a un visitante: nombre, biografía
 * y fotografía. El email, el teléfono, el documento de identidad, la fecha de
 * nacimiento y la ubicación se quedan fuera a propósito: son datos personales
 * que el profesor dio para su cuenta, no para publicarlos.
 */
export class PerfilPublicoDto {
  @ApiProperty({ example: 1 })
  idUsuario: number;

  @ApiProperty({ example: 'Laura Gómez' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Ingeniera de software con 10 años enseñando…' })
  biografia: string | null;

  @ApiPropertyOptional({ example: 'uploads/usuarios/1712345678-foto.png' })
  rutaFoto: string | null;

  constructor(usuario: Usuario) {
    this.idUsuario = usuario.idUsuario;
    this.nombre = usuario.nombre;
    this.biografia = usuario.biografia ?? null;
    this.rutaFoto = usuario.rutaFoto ?? null;
  }
}
