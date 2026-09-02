import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SolicitudesDatosService } from './solicitudes-datos.service';
import { CreateSolicitudDatosDto } from './dto/in/create-solicitud-datos.dto';
import { ResolverSolicitudDatosDto } from './dto/in/resolver-solicitud-datos.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UsuarioActual } from './decorators/usuario-actual.decorator';
import { JwtPayload, RolUsuario } from './roles.enum';

/**
 * Cambio de nombre, fecha de nacimiento o documento de identidad: no se
 * autoedita directo (ver `UsuariosService.actualizarPerfil`), así que
 * cualquier usuario autenticado pide el cambio acá y un administrador lo
 * aprueba o lo rechaza.
 */
@ApiTags('Solicitudes de cambio de datos')
@ApiBearerAuth()
@Controller('solicitudes-datos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({ description: 'El rol no permite esta acción.' })
export class SolicitudesDatosController {
  constructor(private readonly solicitudesDatosService: SolicitudesDatosService) {}

  @Post()
  @ApiOperation({
    summary: 'Solicitar el cambio de nombre, fecha de nacimiento y/o documento de identidad',
    description:
      'Cualquier usuario autenticado puede pedirlo. No aplica nada: queda pendiente ' +
      'hasta que un administrador la resuelva. Solo una solicitud pendiente a la vez.',
  })
  crear(
    @Body() dto: CreateSolicitudDatosDto,
    @UsuarioActual() usuario: JwtPayload,
  ) {
    return this.solicitudesDatosService.crear(dto, usuario);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar solicitudes de cambio de datos',
    description: 'El administrador ve todas; cualquier otro usuario, solo las suyas.',
  })
  listar(@UsuarioActual() usuario: JwtPayload) {
    return this.solicitudesDatosService.listar(usuario);
  }

  @Patch(':id/aprobar')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Aprobar una solicitud',
    description: 'Aplica de inmediato los valores propuestos sobre el usuario solicitante.',
  })
  aprobar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolverSolicitudDatosDto,
    @UsuarioActual() usuario: JwtPayload,
  ) {
    return this.solicitudesDatosService.aprobar(id, dto, usuario);
  }

  @Patch(':id/rechazar')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Rechazar una solicitud',
    description: 'No se aplica ningún cambio. Conviene explicar el motivo en el comentario.',
  })
  rechazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolverSolicitudDatosDto,
    @UsuarioActual() usuario: JwtPayload,
  ) {
    return this.solicitudesDatosService.rechazar(id, dto, usuario);
  }
}
