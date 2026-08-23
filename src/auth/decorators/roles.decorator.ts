import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '../roles.enum';

export const ROLES_KEY = 'roles';

/** Restringe un endpoint a los roles indicados. Sin él, basta con estar autenticado. */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
