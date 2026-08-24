import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../roles.enum';

/** Inyecta el usuario del JWT ya validado por JwtAuthGuard. */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload =>
    ctx.switchToHttp().getRequest().user,
);
