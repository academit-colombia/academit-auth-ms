import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Envío de correo.
 *
 * En local apunta a Mailpit, que captura los mensajes y los muestra en su
 * bandeja web sin mandarlos a internet. Para producción solo cambian las
 * variables MAIL_*; el código es el mismo.
 */
@Injectable()
export class CorreoService {
  private readonly logger = new Logger(CorreoService.name);
  private readonly transporte: nodemailer.Transporter;
  private readonly remitente: string;

  constructor(private readonly configService: ConfigService) {
    const usuario = this.configService.get<string>('MAIL_USER');
    const password = this.configService.get<string>('MAIL_PASSWORD');

    this.transporte = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'mailpit'),
      port: Number(this.configService.get<string>('MAIL_PORT', '1025')),
      secure: this.configService.get<string>('MAIL_SECURE') === 'true',
      // Mailpit no pide credenciales; un SMTP real sí.
      ...(usuario ? { auth: { user: usuario, pass: password } } : {}),
    });

    this.remitente = this.configService.get<string>(
      'MAIL_FROM',
      'Academit <no-responder@academit.com.co>',
    );
  }

  async enviarCodigoVerificacion(
    email: string,
    nombre: string,
    codigo: string,
    minutos: number,
  ): Promise<void> {
    const html = `
      <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1E2420">
        <h1 style="margin:0 0 8px;font-size:22px;color:#17302B">Confirma tu email</h1>
        <p style="margin:0 0 24px;color:#5B6560;font-size:15px">
          Hola ${nombre}, usa este código para terminar de crear tu cuenta en Academit.
        </p>
        <p style="margin:0 0 24px;font-size:34px;font-weight:700;letter-spacing:10px;text-align:center;background:#F1F3EC;border-radius:10px;padding:20px 0">
          ${codigo}
        </p>
        <p style="margin:0 0 8px;color:#5B6560;font-size:14px">
          El código caduca en ${minutos} minutos.
        </p>
        <p style="margin:0;color:#5B6560;font-size:14px">
          Si no fuiste tú quien se registró, puedes ignorar este mensaje: sin el
          código, la cuenta no se activa.
        </p>
      </div>`;

    try {
      await this.transporte.sendMail({
        from: this.remitente,
        to: email,
        subject: `${codigo} es tu código de verificación de Academit`,
        text: `Tu código de verificación es ${codigo}. Caduca en ${minutos} minutos.`,
        html,
      });
      this.logger.log(`Código de verificación enviado a ${email}`);
    } catch (error) {
      // Se registra el fallo pero no se propaga con el código dentro: el
      // usuario puede pedir un reenvío.
      this.logger.error(
        `No se pudo enviar el correo a ${email}: ${error.message}`,
      );
      throw error;
    }
  }
}
