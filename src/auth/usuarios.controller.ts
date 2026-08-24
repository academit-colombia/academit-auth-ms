import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/in/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/in/update-usuario.dto';
import { UsuarioResponseDto } from './dto/out/usuario.response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { InternoGuard } from './guards/interno.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { RolUsuario } from './roles.enum';

/**
 * Alta y mantenimiento de usuarios. Reservado al administrador: es quien
 * reparte los roles, así que ningún otro rol puede crearse permisos a sí mismo.
 */
@Controller('usuarios')
@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
// El alta interna de leads se declara en su propio controlador, más abajo:
// no lleva JWT y no debe heredar estos guards.
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({ description: 'Se requiere rol administrador.' })
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles(RolUsuario.ADMINISTRADOR)
  @UseInterceptors(FileInterceptor('fotografia'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Crear un usuario y asignarle un rol',
    description:
      'Acepta los datos personales y opcionalmente la fotografía de perfil.',
  })
  @ApiResponse({ status: 201, type: UsuarioResponseDto })
  async crear(
    @Body() dto: CreateUsuarioDto,
    @UploadedFile() fotografia?: Express.Multer.File,
  ): Promise<UsuarioResponseDto> {
    return new UsuarioResponseDto(
      await this.usuariosService.crear(dto, fotografia),
    );
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROFESOR)
  @ApiOperation({
    summary: 'Listar usuarios',
    description:
      'El profesor puede consultarlo filtrando por rol para elegir a quién asignar ' +
      'un curso; no recibe ningún dato sensible (nunca se expone el hash).',
  })
  @ApiQuery({ name: 'rol', required: false, enum: RolUsuario })
  @ApiResponse({ status: 200, type: [UsuarioResponseDto] })
  async listar(@Query('rol') rol?: RolUsuario): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.usuariosService.listar(rol);
    return usuarios.map((usuario) => new UsuarioResponseDto(usuario));
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @UseInterceptors(FileInterceptor('fotografia'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Editar un usuario: datos personales, rol, contraseña o estado',
    description:
      'Los campos que no se envían quedan como estaban; una cadena vacía borra ' +
      'el valor. El email no se puede cambiar.',
  })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
    @UploadedFile() fotografia?: Express.Multer.File,
  ): Promise<UsuarioResponseDto> {
    return new UsuarioResponseDto(
      await this.usuariosService.actualizar(id, dto, fotografia),
    );
  }
}
