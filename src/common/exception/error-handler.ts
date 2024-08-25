import { UnauthorizedException, BadRequestException } from '@nestjs/common';

export function handleException(
  error: any,
  customMessages?: { unauthorized?: string; badRequest?: string },
) {
  if (error instanceof UnauthorizedException) {
    throw new UnauthorizedException(
      customMessages?.unauthorized ||
        'Fallo en la autenticación. Verifique su API key.',
    );
  } else {
    throw new BadRequestException(
      customMessages?.badRequest ||
        'Solicitud inválida. Verifique los parámetros enviados.',
    );
  }
}
