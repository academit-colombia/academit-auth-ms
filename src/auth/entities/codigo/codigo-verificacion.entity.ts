import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Código de un solo uso para confirmar el email de una cuenta.
 *
 * El código NO se guarda en claro: se almacena su hash, igual que una
 * contraseña. Quien tuviera acceso a la base podría, si no, verificar cuentas
 * ajenas leyendo la tabla.
 */
@Entity('codigo_verificacion')
@Index('IDX_codigo_usuario', ['idUsuario'])
export class CodigoVerificacion {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_codigo' })
  idCodigo: number;

  @Column('int', { name: 'id_usuario' })
  idUsuario: number;

  @Column('varchar', { name: 'codigo_hash', length: 255 })
  codigoHash: string;

  @Column('datetime', { name: 'expira_en' })
  expiraEn: Date;

  /** Intentos fallidos. Al pasar del máximo el código queda inservible. */
  @Column('int', { name: 'intentos', default: 0 })
  intentos: number;

  /** Marca de uso: un código verificado no vuelve a servir. */
  @Column('datetime', { name: 'usado_en', nullable: true })
  usadoEn: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
