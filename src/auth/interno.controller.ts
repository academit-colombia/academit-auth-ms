import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { UsuariosService } from './usuarios.service';
import { InternoGuard } from './guards/interno.guard';
import { UsuarioResponseDto } from './dto/out/usuario.response.dto';

class LeadDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @IsNotEmpty()
  email: string;
}

/**
 * Endpoints que solo consume otro servicio. Fuera de la documentación pública
 * y protegidos con un secreto compartido, no con JWT.
 */
@Controller('interno')
@ApiExcludeController()
@UseGuards(InternoGuard)
export class InternoController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Busca o crea un estudiante por email, sin contraseña.
   *
   * Lo llama griselda-backend al registrar una inscripción de alguien que dejó
   * sus datos en la landing sin tener cuenta: la inscripción necesita un
   * usuario al que apuntar.
   */
  @Post('leads')
  async lead(@Body() dto: LeadDto): Promise<UsuarioResponseDto> {
    const usuario = await this.usuariosService.buscarOCrearLead(
      dto.nombre,
      dto.email,
    );
    return new UsuarioResponseDto(usuario);
  }

  /**
   * Ficha de un usuario por id.
   *
   * Lo llama griselda-backend para conseguir el email al que avisar cuando
   * anula el intento de examen de un alumno (evaluaciones por sección): solo
   * tiene el `sub` del JWT, que es este id, nunca el email en sus propias
   * tablas.
   */
  @Get('usuarios/:id')
  async usuario(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.usuariosService.buscarPorId(id);
    return new UsuarioResponseDto(usuario);
  }
}
