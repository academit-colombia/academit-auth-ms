import { Controller, Get, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { PerfilPublicoDto } from './dto/out/perfil-publico.dto';

/**
 * Datos que puede ver cualquiera, sin sesión.
 *
 * Va en su propio controlador para que no herede los guards de
 * `UsuariosController`, y para que quede evidente qué se expone al público.
 */
@Controller('publico')
@ApiTags('publico')
export class PublicoController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('profesores/:id')
  @ApiOperation({
    summary: 'Ficha pública de un profesor',
    description:
      'Solo nombre, biografía y fotografía. Los datos de contacto y de ' +
      'identidad no salen nunca por aquí.',
  })
  @ApiResponse({ status: 200, type: PerfilPublicoDto })
  @ApiNotFoundResponse({ description: 'No hay ningún profesor con ese id.' })
  async profesor(@Param('id', ParseIntPipe) id: number): Promise<PerfilPublicoDto> {
    try {
      return new PerfilPublicoDto(
        await this.usuariosService.buscarProfesorPublico(id),
      );
    } catch {
      throw new NotFoundException('No hay ningún profesor con ese id.');
    }
  }
}
