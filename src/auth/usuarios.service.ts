import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Usuario } from './entities/usuario/usuario.entity';
import { RolUsuario } from './roles.enum';
import { CreateUsuarioDto } from './dto/in/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/in/update-usuario.dto';
import { RegistroDto } from './dto/in/registro.dto';
import { DatosPersonalesDto } from './dto/in/datos-personales.dto';

const ROUNDS_BCRYPT = 10;

/** Todos los campos personales, tocables por un administrador (crear/editar usuario). */
const CAMPOS_PERSONALES_COMPLETOS: (keyof DatosPersonalesDto & keyof Usuario)[] = [
  'nombre',
  'telefono',
  'fechaNacimiento',
  'paisResidencia',
  'ciudad',
  'documentoIdentidad',
  'genero',
  'biografia',
  'direccion',
  'codigoPostal',
];

/**
 * Campos que el propio usuario puede autoeditar. Nombre, fecha de nacimiento y
 * documento de identidad quedan afuera a propósito: identifican a la persona
 * real detrás de la cuenta, así que su cambio pasa por una solicitud que
 * aprueba un administrador (ver `SolicitudesDatosService`), no por acá.
 */
const CAMPOS_AUTOEDITABLES = CAMPOS_PERSONALES_COMPLETOS.filter(
  (campo) => !(['nombre', 'fechaNacimiento', 'documentoIdentidad'] as string[]).includes(campo),
);

@Injectable()
export class UsuariosService implements OnModuleInit {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Crea el administrador inicial si la tabla está vacía. Sin esto no habría
   * forma de entrar: crear usuarios exige ya ser administrador.
   */
  async onModuleInit(): Promise<void> {
    const total = await this.usuarioRepository.count();
    if (total > 0) return;

    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');

    if (!email || !password) {
      this.logger.warn(
        'No hay usuarios y faltan ADMIN_EMAIL/ADMIN_PASSWORD: nadie podrá iniciar sesión.',
      );
      return;
    }

    const admin = await this.crear({
      nombre: this.configService.get<string>('ADMIN_NOMBRE', 'Administrador'),
      email,
      password,
      rol: RolUsuario.ADMINISTRADOR,
    });
    // Se dan por verificados: no hay nadie que pueda confirmarlos y sin ellos
    // no habría forma de entrar al sistema.
    await this.usuarioRepository.update(admin.idUsuario, {
      emailVerificado: true,
    });
    this.logger.log(`Administrador inicial creado: ${email}`);

    // Profesor de ejemplo para poder probar el flujo de permisos de inmediato.
    const emailProfesor = this.configService.get<string>('PROFESOR_EMAIL');
    const passwordProfesor = this.configService.get<string>('PROFESOR_PASSWORD');
    if (emailProfesor && passwordProfesor) {
      const profesor = await this.crear({
        nombre: this.configService.get<string>('PROFESOR_NOMBRE', 'Profesor'),
        email: emailProfesor,
        password: passwordProfesor,
        rol: RolUsuario.PROFESOR,
      });
      await this.usuarioRepository.update(profesor.idUsuario, {
        emailVerificado: true,
      });
      this.logger.log(
        `Profesor de ejemplo creado: ${emailProfesor} (id ${profesor.idUsuario})`,
      );
    }
  }

  /**
   * Vuelca los datos personales presentes en el DTO sobre la entidad.
   *
   * Solo se tocan las claves que llegaron: `undefined` significa "no lo mandes,
   * déjalo como está", mientras que una cadena vacía sí borra el valor. Esa
   * distinción importa porque el formulario viaja en multipart y no envía los
   * campos que no se editaron.
   */
  private aplicarDatosPersonales(
    usuario: Usuario,
    dto: DatosPersonalesDto,
    campos: (keyof DatosPersonalesDto & keyof Usuario)[] = CAMPOS_PERSONALES_COMPLETOS,
  ): void {
    campos.forEach((campo) => {
      const valor = dto[campo];
      if (valor === undefined) return;
      // El nombre es obligatorio: vaciarlo dejaría al usuario sin identidad.
      if (campo === 'nombre' && !String(valor).trim()) return;
      (usuario as unknown as Record<string, unknown>)[campo] =
        String(valor).trim() === '' ? null : valor;
    });
  }

  /** Reemplaza la foto y borra la anterior del disco para no acumular huérfanos. */
  private async aplicarFotografia(
    usuario: Usuario,
    archivo?: Express.Multer.File,
  ): Promise<void> {
    if (!archivo) return;

    const anterior = usuario.rutaFoto;
    usuario.rutaFoto = `uploads/usuarios/${archivo.filename}`;

    if (anterior && anterior !== usuario.rutaFoto) {
      try {
        await fs.unlink(join(process.cwd(), anterior));
      } catch {
        // Que el archivo viejo ya no esté no debe impedir guardar el nuevo.
        this.logger.warn(`No se pudo borrar la foto anterior: ${anterior}`);
      }
    }
  }

  /**
   * Alta directa. Solo la usa un administrador (o el arranque inicial), así que
   * la cuenta nace verificada: es él quien responde por ese email. El registro
   * público va por `registrar()`, que sí exige el código.
   */
  async crear(dto: CreateUsuarioDto, foto?: Express.Multer.File): Promise<Usuario> {
    const existente = await this.usuarioRepository.findOne({
      where: { email: dto.email },
    });
    if (existente) {
      throw new ConflictException(`Ya existe un usuario con el email ${dto.email}.`);
    }

    const usuario = this.usuarioRepository.create({
      email: dto.email,
      rol: dto.rol,
      activo: true,
      emailVerificado: true,
      passwordHash: dto.password
        ? await bcrypt.hash(dto.password, ROUNDS_BCRYPT)
        : null,
    });

    this.aplicarDatosPersonales(usuario, dto);
    await this.aplicarFotografia(usuario, foto);

    return this.usuarioRepository.save(usuario);
  }

  /**
   * Registro desde la landing. El rol se fuerza a estudiante: aceptar el rol que
   * mande el cliente permitiría que cualquiera se diera de alta como
   * administrador.
   *
   * Si el email ya existe como lead sin contraseña, se le asigna esta y la
   * cuenta queda activa; así quien dejó sus datos en el formulario y luego se
   * registra conserva sus inscripciones en vez de duplicarse.
   */
  async registrar(dto: RegistroDto): Promise<Usuario> {
    const existente = await this.usuarioRepository.findOne({
      where: { email: dto.email },
      select: ['idUsuario', 'email', 'passwordHash'],
    });

    if (existente?.passwordHash) {
      throw new ConflictException(
        'Ya existe una cuenta con ese email. Inicia sesión.',
      );
    }

    if (existente) {
      const usuario = await this.buscarPorId(existente.idUsuario);
      // Además del nombre, el registro trae los datos de identificación
      // (teléfono, documento, fecha de nacimiento, país, ciudad...): sin
      // esto se perderían al convertir el lead en cuenta.
      this.aplicarDatosPersonales(usuario, dto);
      usuario.rol = RolUsuario.ESTUDIANTE;
      usuario.activo = true;
      usuario.passwordHash = await bcrypt.hash(dto.password, ROUNDS_BCRYPT);
      // Aunque venga de un lead, el email sigue sin confirmarse: nadie ha
      // demostrado todavía tener acceso a ese buzón.
      usuario.emailVerificado = false;
      this.logger.log(`Lead convertido en cuenta pendiente de verificar: ${dto.email}`);
      return this.usuarioRepository.save(usuario);
    }

    const nuevo = await this.crear({ ...dto, rol: RolUsuario.ESTUDIANTE });
    nuevo.emailVerificado = false;
    return this.usuarioRepository.save(nuevo);
  }

  /**
   * Busca o crea un estudiante a partir de su email, sin contraseña.
   *
   * Lo usa griselda-backend cuando alguien deja sus datos en el formulario de
   * la landing sin tener cuenta: la inscripción necesita un usuario al que
   * apuntar, pero esa persona todavía no eligió contraseña.
   */
  async buscarOCrearLead(nombre: string, email: string): Promise<Usuario> {
    const existente = await this.usuarioRepository.findOne({ where: { email } });
    if (existente) return existente;

    const usuario = this.usuarioRepository.create({
      nombre,
      email,
      rol: RolUsuario.ESTUDIANTE,
      activo: true,
      passwordHash: null,
    });

    this.logger.log(`Lead dado de alta como estudiante sin contraseña: ${email}`);
    return this.usuarioRepository.save(usuario);
  }

  async listar(rol?: RolUsuario): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      where: rol ? { rol } : {},
      order: { idUsuario: 'ASC' },
    });
  }

  async buscarPorId(idUsuario: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: { idUsuario } });
    if (!usuario) {
      throw new NotFoundException(`No existe el usuario con id ${idUsuario}.`);
    }
    return usuario;
  }

  /** Edición completa: datos personales, permisos y contraseña. Solo administrador. */
  /**
   * Ficha pública de un profesor.
   *
   * Solo devuelve usuarios con rol profesor: exponer la de un estudiante o un
   * administrador filtraría datos de quien nunca pidió aparecer en el sitio.
   */
  async buscarProfesorPublico(idUsuario: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario, rol: RolUsuario.PROFESOR },
    });
    if (!usuario) {
      throw new NotFoundException('No hay ningún profesor con ese id.');
    }
    return usuario;
  }

  async actualizar(
    idUsuario: number,
    dto: UpdateUsuarioDto,
    foto?: Express.Multer.File,
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(idUsuario);

    this.aplicarDatosPersonales(usuario, dto);
    await this.aplicarFotografia(usuario, foto);

    if (dto.rol !== undefined) usuario.rol = dto.rol;
    if (dto.activo !== undefined) usuario.activo = dto.activo === 'true';
    if (dto.password) {
      usuario.passwordHash = await bcrypt.hash(dto.password, ROUNDS_BCRYPT);
    }

    return this.usuarioRepository.save(usuario);
  }

  /**
   * Edición del propio perfil. A diferencia de `actualizar`, no puede tocar el
   * rol, el estado de la cuenta ni el email: nadie se asciende a sí mismo.
   *
   * Para profesor y estudiante, tampoco puede tocar nombre, fecha de
   * nacimiento ni documento de identidad: esos tres solo cambian mediante una
   * solicitud aprobada por un administrador (`SolicitudesDatosService`). Si
   * llegan en el body, se ignoran en silencio, igual que ya hace este método
   * con `rol`/`activo`.
   *
   * El administrador es la excepción: es quien aprueba esas solicitudes para
   * todos los demás, así que no tiene sentido pedirle que se apruebe a sí
   * mismo — para él, estos tres campos se autoeditan igual que el resto.
   */
  async actualizarPerfil(
    idUsuario: number,
    dto: DatosPersonalesDto,
    foto?: Express.Multer.File,
    rol?: RolUsuario,
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(idUsuario);
    const campos =
      rol === RolUsuario.ADMINISTRADOR ? CAMPOS_PERSONALES_COMPLETOS : CAMPOS_AUTOEDITABLES;
    this.aplicarDatosPersonales(usuario, dto, campos);
    await this.aplicarFotografia(usuario, foto);
    return this.usuarioRepository.save(usuario);
  }

  /**
   * Valida email y contraseña. El mismo mensaje para "no existe", "inactivo" y
   * "contraseña incorrecta": distinguirlos revelaría qué emails están dados de alta.
   */
  async validarCredenciales(email: string, password: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email },
      select: [
        'idUsuario',
        'nombre',
        'email',
        'rol',
        'activo',
        'emailVerificado',
        'passwordHash',
        'createdAt',
      ],
    });

    // Se compara siempre —aunque no exista el usuario o no tenga contraseña—
    // para no filtrar por el tiempo de respuesta qué emails están dados de alta.
    const hash =
      usuario?.passwordHash ||
      '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
    const coincide = await bcrypt.compare(password, hash);

    if (!usuario || !usuario.activo || !usuario.passwordHash || !coincide) {
      throw new UnauthorizedException('Email o contraseña incorrectos.');
    }

    // Este mensaje sí es específico: quien llega aquí ya demostró conocer la
    // contraseña, así que no se le está revelando nada que no supiera.
    if (!usuario.emailVerificado) {
      throw new UnauthorizedException(
        'Tienes que confirmar tu email antes de entrar. Revisa tu correo o pide un código nuevo.',
      );
    }

    return usuario;
  }
}
