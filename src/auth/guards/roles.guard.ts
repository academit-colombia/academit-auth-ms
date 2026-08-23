import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload, RolUsuario } from '../roles.enum';

/**
 * Comprueba el rol del JWT contra los que declara `@Roles()`. Se usa siempre
 * después de `JwtAuthGuard`: aquí ya se da por hecho que `req.user` existe.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin @Roles() el endpoint solo exige estar autenticado.
    if (!rolesRequeridos || rolesRequeridos.length === 0) return true;

    const usuario: JwtPayload = context.switchToHttp().getRequest().user;

    if (!usuario || !rolesRequeridos.includes(usuario.rol)) {
      throw new ForbiddenException(
        `Esta acción requiere el rol: ${rolesRequeridos.join(' o ')}.`,
      );
    }

    return true;
  }
}
