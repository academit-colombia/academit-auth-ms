import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GeneroUsuario, RolUsuario } from '../../roles.enum';

/**
 * Usuario del sistema. Vive en la base `academit_auth`, separada de los datos
 * de negocio: `griselda-backend` no consulta esta tabla, solo confía en el rol
 * que viaja firmado en el JWT.
 */
@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_usuario' })
  idUsuario: number;

  @Column('varchar', { name: 'nombre', length: 255 })
  nombre: string;

  @Column('varchar', { name: 'email', length: 255, unique: true })
  email: string;

  /**
   * Hash bcrypt. La contraseña en claro no se guarda ni aparece en logs.
   *
   * Admite NULL: los leads que llegan por el formulario de la landing se crean
   * como cuentas de estudiante sin contraseña. Existen y se les puede atar una
   * inscripción, pero no pueden iniciar sesión hasta definirla.
   */
  @Column('varchar', { name: 'password_hash', length: 255, nullable: true, select: false })
  passwordHash: string | null;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.ESTUDIANTE,
    name: 'rol',
  })
  rol: RolUsuario;

  // ---------------------------------------------------------------
  // Datos personales. Todos opcionales: se piden al crear la cuenta
  // pero se completan después, desde «Mi perfil».
  // ---------------------------------------------------------------

  @Column('varchar', { name: 'telefono', length: 30, nullable: true })
  telefono: string | null;

  /** Solo la fecha, sin hora: no aporta nada y complicaría las zonas horarias. */
  @Column('date', { name: 'fecha_nacimiento', nullable: true })
  fechaNacimiento: string | null;

  /** Código ISO 3166-1 alfa-2 (CO, ES, MX…), no el nombre del país. */
  @Column('varchar', { name: 'pais_residencia', length: 2, nullable: true })
  paisResidencia: string | null;

  @Column('varchar', { name: 'ciudad', length: 120, nullable: true })
  ciudad: string | null;

  @Column('varchar', { name: 'documento_identidad', length: 40, nullable: true })
  documentoIdentidad: string | null;

  @Column('varchar', { name: 'direccion', length: 255, nullable: true })
  direccion: string | null;

  @Column('varchar', { name: 'codigo_postal', length: 20, nullable: true })
  codigoPostal: string | null;

  @Column({
    type: 'enum',
    enum: GeneroUsuario,
    name: 'genero',
    nullable: true,
  })
  genero: GeneroUsuario | null;

  /** Presentación breve. Para un profesor, es lo que acompaña a sus cursos. */
  @Column('text', { name: 'biografia', nullable: true })
  biografia: string | null;

  /** Ruta relativa del archivo, servida por este mismo servicio en /uploads/. */
  @Column('varchar', { name: 'ruta_foto', length: 255, nullable: true })
  rutaFoto: string | null;

  /**
   * Email confirmado con el código enviado al registrarse.
   *
   * Sin verificar no se puede iniciar sesión: es lo que impide dar de alta
   * cuentas con correos ajenos o inexistentes.
   */
  @Column('boolean', { name: 'email_verificado', default: false })
  emailVerificado: boolean;

  /** Un usuario inactivo no puede iniciar sesión, pero conserva su historial. */
  @Column('boolean', { name: 'activo', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
