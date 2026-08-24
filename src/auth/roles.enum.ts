/**
 * Roles del sistema. El valor es el que viaja en el JWT y el que guardan las
 * dos bases de datos, así que no se renombra sin migrar.
 */
export enum RolUsuario {
  ADMINISTRADOR = 'administrador',
  PROFESOR = 'profesor',
  ESTUDIANTE = 'estudiante',
}

export const ROLES_VALIDOS = Object.values(RolUsuario);

/** Opciones de género. `PREFIERO_NO_DECIR` existe para no forzar la respuesta. */
export enum GeneroUsuario {
  FEMENINO = 'femenino',
  MASCULINO = 'masculino',
  OTRO = 'otro',
  PREFIERO_NO_DECIR = 'prefiero_no_decir',
}

/** Contenido del JWT que emite este servicio y que valida griselda-backend. */
export interface JwtPayload {
  /** id del usuario en la tabla `usuario` de `academit_auth`. */
  sub: number;
  email: string;
  nombre: string;
  rol: RolUsuario;
}
