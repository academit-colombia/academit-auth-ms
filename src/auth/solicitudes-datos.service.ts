import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EstadoSolicitudDatos,
  SolicitudCambioDatos,
} from './entities/solicitud-cambio-datos/solicitud-cambio-datos.entity';
import { Usuario } from './entities/usuario/usuario.entity';
import { JwtPayload, RolUsuario } from './roles.enum';
import { CreateSolicitudDatosDto } from './dto/in/create-solicitud-datos.dto';
import { ResolverSolicitudDatosDto } from './dto/in/resolver-solicitud-datos.dto';

@Injectable()
export class SolicitudesDatosService {
  private readonly logger = new Logger(SolicitudesDatosService.name);

  constructor(
    @InjectRepository(SolicitudCambioDatos)
    private readonly solicitudRepository: Repository<SolicitudCambioDatos>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  /**
   * Registra la petición de un usuario para cambiar nombre, fecha de
   * nacimiento y/o documento de identidad. No aplica nada: solo un
   * administrador puede aprobarla.
   */
  async crear(
    dto: CreateSolicitudDatosDto,
    usuario: JwtPayload,
  ): Promise<SolicitudCambioDatos> {
    if (
      dto.nombrePropuesto === undefined &&
      dto.fechaNacimientoPropuesta === undefined &&
      dto.documentoIdentidadPropuesto === undefined
    ) {
      throw new BadRequestException(
        'Tenés que proponer al menos un cambio: nombre, fecha de nacimiento o documento de identidad.',
      );
    }

    const pendiente = await this.solicitudRepository.findOne({
      where: { idSolicitante: usuario.sub, estado: EstadoSolicitudDatos.PENDIENTE },
    });
    if (pendiente) {
      throw new BadRequestException(
        `Ya tenés una solicitud pendiente (#${pendiente.idSolicitud}). Esperá a que se resuelva antes de crear otra.`,
      );
    }

    const solicitud = this.solicitudRepository.create({
      idSolicitante: usuario.sub,
      nombreSolicitante: usuario.nombre,
      nombrePropuesto: dto.nombrePropuesto ?? null,
      fechaNacimientoPropuesta: dto.fechaNacimientoPropuesta ?? null,
      documentoIdentidadPropuesto: dto.documentoIdentidadPropuesto ?? null,
      motivo: dto.motivo,
      estado: EstadoSolicitudDatos.PENDIENTE,
    });

    const guardada = await this.solicitudRepository.save(solicitud);
    this.logger.log(
      `Solicitud de datos #${guardada.idSolicitud}: ${usuario.email} pide cambiar sus datos restringidos.`,
    );
    return guardada;
  }

  /** El administrador ve todas; cualquier otro usuario, solo las suyas. */
  async listar(usuario: JwtPayload): Promise<SolicitudCambioDatos[]> {
    return this.solicitudRepository.find({
      where:
        usuario.rol === RolUsuario.ADMINISTRADOR
          ? {}
          : { idSolicitante: usuario.sub },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Aplica los valores propuestos sobre `Usuario` y marca la solicitud como
   * aprobada. A diferencia de la autoedición, este camino sí puede tocar
   * nombre/fecha de nacimiento/documento de identidad: lo inicia un
   * administrador, no el propio usuario.
   */
  async aprobar(
    idSolicitud: number,
    dto: ResolverSolicitudDatosDto,
    usuario: JwtPayload,
  ): Promise<SolicitudCambioDatos> {
    const solicitud = await this.buscarPendiente(idSolicitud);

    const cambios: Partial<Usuario> = {};
    if (solicitud.nombrePropuesto !== null) cambios.nombre = solicitud.nombrePropuesto;
    if (solicitud.fechaNacimientoPropuesta !== null) {
      cambios.fechaNacimiento = solicitud.fechaNacimientoPropuesta;
    }
    if (solicitud.documentoIdentidadPropuesto !== null) {
      cambios.documentoIdentidad = solicitud.documentoIdentidadPropuesto;
    }
    await this.usuarioRepository.update(solicitud.idSolicitante, cambios);

    solicitud.estado = EstadoSolicitudDatos.APROBADA;
    return this.resolver(solicitud, dto, usuario);
  }

  async rechazar(
    idSolicitud: number,
    dto: ResolverSolicitudDatosDto,
    usuario: JwtPayload,
  ): Promise<SolicitudCambioDatos> {
    const solicitud = await this.buscarPendiente(idSolicitud);
    solicitud.estado = EstadoSolicitudDatos.RECHAZADA;
    return this.resolver(solicitud, dto, usuario);
  }

  private async buscarPendiente(idSolicitud: number): Promise<SolicitudCambioDatos> {
    const solicitud = await this.solicitudRepository.findOne({ where: { idSolicitud } });

    if (!solicitud) {
      throw new NotFoundException(`No existe la solicitud #${idSolicitud}.`);
    }
    if (solicitud.estado !== EstadoSolicitudDatos.PENDIENTE) {
      throw new BadRequestException(`La solicitud #${idSolicitud} ya fue ${solicitud.estado}.`);
    }

    return solicitud;
  }

  private async resolver(
    solicitud: SolicitudCambioDatos,
    dto: ResolverSolicitudDatosDto,
    usuario: JwtPayload,
  ): Promise<SolicitudCambioDatos> {
    solicitud.idRevisor = usuario.sub;
    solicitud.nombreRevisor = usuario.nombre;
    solicitud.comentarioRevision = dto.comentario ?? null;
    solicitud.revisadaEn = new Date();

    const guardada = await this.solicitudRepository.save(solicitud);
    this.logger.log(
      `Solicitud de datos #${guardada.idSolicitud} ${guardada.estado} por ${usuario.email}.`,
    );
    return guardada;
  }
}
