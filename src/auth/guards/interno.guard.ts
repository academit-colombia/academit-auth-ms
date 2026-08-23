import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Protege los endpoints que solo llama otro servicio, nunca un navegador.
 *
 * `griselda-backend` necesita dar de alta estudiantes cuando alguien deja sus
 * datos en la landing sin tener cuenta. Esa llamada no lleva JWT —no hay
 * usuario todavía—, así que se autentica con un secreto compartido.
 */
@Injectable()
export class InternoGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const esperado = this.configService.get<string>('INTERNAL_API_KEY');
    const recibido = context.switchToHttp().getRequest().headers['x-internal-key'];

    // Sin secreto configurado se rechaza siempre: es preferible que el alta de
    // leads falle a dejar abierto un endpoint que crea usuarios.
    if (!esperado || recibido !== esperado) {
      throw new UnauthorizedException('Llamada interna no autorizada.');
    }

    return true;
  }
}
