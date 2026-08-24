import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { LessThan, Repository } from 'typeorm';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { CodigoVerificacion } from './entities/codigo/codigo-verificacion.entity';
import { Usuario } from './entities/usuario/usuario.entity';
import { CorreoService } from './correo/correo.service';

@Injectable()
export class VerificacionService {
  private readonly logger = new Logger(VerificacionService.name);

  constructor(
    @InjectRepository(CodigoVerificacion)
    private readonly codigoRepository: Repository<CodigoVerificacion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly correoService: CorreoService,
    private readonly configService: ConfigService,
  ) {}

  private get minutosValidez(): number {
    return Number(this.configService.get<string>('OTP_MINUTOS_VALIDEZ', '10'));
  }

  private get maxIntentos(): number {
    return Number(this.configService.get<string>('OTP_MAX_INTENTOS', '5'));
  }

  private get segundosEntreEnvios(): number {
    return Number(
      this.configService.get<string>('OTP_SEGUNDOS_ENTRE_ENVIOS', '60'),
    );
  }

  /**
   * Genera un código, lo guarda hasheado y lo manda por correo.
   *
   * Cada envío invalida los códigos anteriores del usuario: si no, un código
   * viejo seguiría sirviendo y multiplicaría las oportunidades de acertarlo.
   */
  async enviarCodigo(usuario: Usuario): Promise<void> {
    const ultimo = await this.codigoRepository.findOne({
      where: { idUsuario: usuario.idUsuario },
      order: { idCodigo: 'DESC' },
    });

    // Freno al reenvío: evita usar el endpoint para bombardear un buzón ajeno.
    if (ultimo && !ultimo.usadoEn) {
      const segundos = (Date.now() - ultimo.createdAt.getTime()) / 1000;
      if (segundos < this.segundosEntreEnvios) {
        throw new BadRequestException(
          `Espera ${Math.ceil(this.segundosEntreEnvios - segundos)} segundos antes de pedir otro código.`,
        );
      }
    }

    await this.codigoRepository.delete({ idUsuario: usuario.idUsuario });

    // `randomInt` usa el generador criptográfico; `Math.random` sería adivinable.
    const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');

    await this.codigoRepository.save(
      this.codigoRepository.create({
        idUsuario: usuario.idUsuario,
        // Hasheado, como una contraseña: en claro permitiría verificar cuentas
        // ajenas con solo leer la tabla.
        codigoHash: await bcrypt.hash(codigo, 10),
        expiraEn: new Date(Date.now() + this.minutosValidez * 60_000),
      }),
    );

    await this.correoService.enviarCodigoVerificacion(
      usuario.email,
      usuario.nombre,
      codigo,
      this.minutosValidez,
    );
  }

  /** Reenvía el código a una cuenta que aún no confirmó su email. */
  async reenviar(email: string): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ where: { email } });

    // Silencio deliberado si no existe o ya está verificada: responder distinto
    // revelaría qué emails están dados de alta.
    if (!usuario || usuario.emailVerificado) {
      this.logger.log(`Reenvío ignorado para ${email}`);
      return;
    }

    await this.enviarCodigo(usuario);
  }

  /**
   * Comprueba el código y marca el email como verificado.
   *
   * Devuelve el usuario para que quien llama pueda emitirle la sesión.
   */
  async verificar(email: string, codigo: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: { email } });
    if (!usuario) {
      throw new NotFoundException('No hay ninguna cuenta con ese email.');
    }
    if (usuario.emailVerificado) {
      throw new BadRequestException('Esta cuenta ya está verificada.');
    }

    const registro = await this.codigoRepository.findOne({
      where: { idUsuario: usuario.idUsuario },
      order: { idCodigo: 'DESC' },
    });

    if (!registro || registro.usadoEn) {
      throw new BadRequestException(
        'No hay ningún código pendiente. Pide uno nuevo.',
      );
    }

    if (registro.expiraEn.getTime() < Date.now()) {
      throw new BadRequestException('El código caducó. Pide uno nuevo.');
    }

    if (registro.intentos >= this.maxIntentos) {
      throw new BadRequestException(
        'Demasiados intentos fallidos. Pide un código nuevo.',
      );
    }

    if (!(await bcrypt.compare(codigo, registro.codigoHash))) {
      registro.intentos += 1;
      await this.codigoRepository.save(registro);
      const restantes = this.maxIntentos - registro.intentos;
      throw new BadRequestException(
        restantes > 0
          ? `Código incorrecto. Te quedan ${restantes} intentos.`
          : 'Código incorrecto. Se agotaron los intentos: pide uno nuevo.',
      );
    }

    registro.usadoEn = new Date();
    await this.codigoRepository.save(registro);

    usuario.emailVerificado = true;
    const guardado = await this.usuarioRepository.save(usuario);
    this.logger.log(`Email verificado: ${email}`);
    return guardado;
  }

  /** Limpia códigos caducados; se puede llamar sin peligro en cualquier momento. */
  async limpiarCaducados(): Promise<void> {
    await this.codigoRepository.delete({ expiraEn: LessThan(new Date()) });
  }
}
