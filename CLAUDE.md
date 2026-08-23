# CLAUDE.md

Servicio de autenticación de Academit (NestJS + TypeORM). Es la **única** fuente
de usuarios y roles: emite los JWT que autorizan tanto sus endpoints como los de
`griselda-backend`.

## Comandos

```bash
npm run build
npx tsc --noEmit
npm run start:prod
```

Base `academit_auth` con `synchronize: true`: las tablas se crean solas desde las
entidades. No hay migraciones.

## Roles

`src/auth/roles.enum.ts` define los tres valores que viajan en el JWT y que
guardan las dos bases. **No se renombran sin migrar los datos.**

| Rol | Alcance |
|---|---|
| `administrador` | Todo el panel: contenido del sitio, cursos, usuarios, métricas y resolución de solicitudes. |
| `profesor` | Solo sus propios cursos. No puede borrarlos: pide aprobación. |
| `estudiante` | Ningún acceso al panel. |

## Contenido del JWT

```ts
{ sub: idUsuario, email, nombre, rol }
```

`sub` es lo que `griselda-backend` guarda en `curso.id_profesor`. No hay clave
foránea entre bases: la relación se resuelve comparando ese valor con el token.

## Verificación de email por código

El registro público **no abre sesión**: crea la cuenta con
`email_verificado = false`, manda un código de 6 dígitos y devuelve
`requiereVerificacion: true`. Solo `POST /auth/verificar` entrega el token.

`validarCredenciales` rechaza a quien no ha verificado, así que sin confirmar no
hay sesión y, por tanto, tampoco inscripciones.

### Decisiones que no se deben deshacer

- **El código se guarda hasheado con bcrypt**, igual que una contraseña. En
  claro, quien leyera la tabla podría verificar cuentas ajenas.
- **`randomInt` de `crypto`**, no `Math.random`: este último es predecible.
- **Cada envío borra los códigos anteriores.** Si no, un código viejo seguiría
  sirviendo y multiplicaría las oportunidades de acertarlo.
- **`reenviar-codigo` responde igual exista o no la cuenta.** Distinguirlo
  revelaría qué emails están registrados.
- **Espera mínima entre envíos** (`OTP_SEGUNDOS_ENTRE_ENVIOS`): sin ella el
  endpoint sirve para bombardear un buzón ajeno.
- **Máximo de intentos** (`OTP_MAX_INTENTOS`): 6 dígitos son un millón de
  combinaciones, pero sin límite se prueban todas.
- **Las cuentas que crea un administrador nacen verificadas**, igual que el
  administrador inicial y el profesor semilla: no hay nadie que pueda
  confirmarlos y sin ellos no se podría entrar nunca.

### Correo

`CorreoService` usa nodemailer. En local apunta a **Mailpit**
(`docker compose`, bandeja en http://localhost:8025), que captura los mensajes
sin mandarlos a internet. Para producción solo cambian las variables `MAIL_*`.

## Perfil público del profesor

`GET /publico/profesores/:id` es el único endpoint sin autenticación que expone
datos de una persona, y devuelve **solo `nombre`, `biografia` y `rutaFoto`**.

El email, el teléfono, el documento de identidad, la fecha de nacimiento y la
ubicación se quedan fuera a propósito: son datos que el usuario dio para su
cuenta, no para publicarlos. **No añadas campos a `PerfilPublicoDto` sin pensar
si deben verse desde internet.**

Solo responde para usuarios con rol `profesor`; para un estudiante o un
administrador devuelve 404, para no filtrar perfiles de quien nunca pidió
aparecer en el sitio.

## Cuentas sin contraseña

`password_hash` admite NULL. Los interesados que dejan sus datos en la landing
se crean como estudiantes sin contraseña: existen y se les puede atar una
inscripción, pero **no pueden iniciar sesión** hasta definirla. Al registrarse
con ese mismo email, la cuenta se reutiliza y conserva sus inscripciones en vez
de duplicarse.

El login rechaza explícitamente a quien no tiene contraseña; sin esa
comprobación, un hash vacío podría dejar pasar.

## Endpoints

- `POST /auth/login` — email + contraseña. Público.
- `POST /auth/registro` — público. **El rol es siempre `estudiante`**: aceptar
  un rol en el cuerpo permitiría darse de alta como administrador.
- `POST /interno/leads` — solo servicio a servicio, autenticado con
  `INTERNAL_API_KEY` (cabecera `x-internal-key`), fuera de la documentación
  pública. Lo llama griselda-backend para dar de alta interesados.
- `GET /auth/me` — revalida el token y **relee el rol de la base**, porque pudo
  cambiar después de emitirlo.
- `POST /usuarios`, `PATCH /usuarios/:id` — solo `administrador`.
- `GET /usuarios` — `administrador` y `profesor`.
- `POST /auth/create-keypair` — infraestructura RSA preexistente, sin relación
  con el login.

## Reglas

- **Las contraseñas se guardan con bcrypt** (`bcryptjs`, 10 rondas). La columna
  `password_hash` tiene `select: false`: no sale en las consultas por defecto.
- **El login responde igual ante "no existe", "inactivo" y "contraseña
  incorrecta"**, y compara el hash aunque el usuario no exista, para no filtrar
  qué emails están dados de alta ni por mensaje ni por tiempo de respuesta.
- **Crear usuarios exige ser administrador.** Por eso `UsuariosService.onModuleInit`
  crea uno inicial desde `ADMIN_EMAIL`/`ADMIN_PASSWORD` si la tabla está vacía:
  sin ese arranque nadie podría entrar nunca.
- **`JWT_SECRET` debe ser idéntico al de `griselda-backend`.** Si se cambia en un
  lado y no en el otro, el panel autentica pero el backend rechaza todo con 401.
- **CORS está abierto** (`cors: true` en `main.ts`) porque el panel corre en otro
  origen. Acotar los orígenes antes de producción.

## Nota histórica

El `login` original recibía un API key y credenciales cifradas con RSA, y
**nunca validaba nada**: firmaba un JWT con el username que llegara. `signup`
llamaba a `login(apikey, '', '')`, es decir, emitía tokens sin credenciales.
Ambos se reemplazaron al construir el sistema de roles; `create-keypair` se
conserva intacto.
