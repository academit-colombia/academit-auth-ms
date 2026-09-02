import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EstadoSolicitudDatos {
  PENDIENTE = 'pendiente',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
}

/**
 * Petición de un usuario para cambiar su nombre, fecha de nacimiento o
 * documento de identidad — los tres campos que ya no se autoeditan directo
 * (ver `UsuariosService.actualizarPerfil`), porque identifican a la persona
 * real detrás de la cuenta.
 *
 * El usuario no cambia estos datos directamente: registra la solicitud, con
 * al menos uno de los tres valores propuestos, y es un administrador quien la
 * aprueba —y entonces se aplican sobre `Usuario`— o la rechaza. Mismo shape
 * que `SolicitudEliminacionCurso` de griselda-backend: no se puede reutilizar
 * esa tabla porque vive en otra base sin acceso a `Usuario`.
 */
@Entity('solicitud_cambio_datos')
@Index('IDX_solicitud_datos_solicitante', ['idSolicitante'])
@Index('IDX_solicitud_datos_estado', ['estado'])
export class SolicitudCambioDatos {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_solicitud' })
  idSolicitud: number;

  @Column('int', { name: 'id_solicitante' })
  idSolicitante: number;

  @Column('varchar', { name: 'nombre_solicitante', length: 255 })
  nombreSolicitante: string;

  @Column('varchar', { name: 'nombre_propuesto', length: 255, nullable: true })
  nombrePropuesto: string | null;

  @Column('date', { name: 'fecha_nacimiento_propuesta', nullable: true })
  fechaNacimientoPropuesta: string | null;

  @Column('varchar', { name: 'documento_identidad_propuesto', length: 40, nullable: true })
  documentoIdentidadPropuesto: string | null;

  @Column('text', { name: 'motivo' })
  motivo: string;

  @Column({
    type: 'enum',
    enum: EstadoSolicitudDatos,
    default: EstadoSolicitudDatos.PENDIENTE,
    name: 'estado',
  })
  estado: EstadoSolicitudDatos;

  /** Administrador que resolvió la solicitud; NULL mientras está pendiente. */
  @Column('int', { name: 'id_revisor', nullable: true })
  idRevisor: number | null;

  @Column('varchar', { name: 'nombre_revisor', length: 255, nullable: true })
  nombreRevisor: string | null;

  @Column('text', { name: 'comentario_revision', nullable: true })
  comentarioRevision: string | null;

  @Column('datetime', { name: 'revisada_en', nullable: true })
  revisadaEn: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
