#!/bin/sh
#
# Aplica las migraciones pendientes y, solo si todas terminan bien, arranca la
# aplicación.
#
# Hasta este cambio el esquema de `academit_auth` lo construía `synchronize:
# true` en cada arranque, decidiendo por su cuenta qué ALTER ejecutar sobre la
# base que guarda las cuentas. Ahora lo construyen las migraciones, y este es el
# sitio donde se aplican.
#
# Aquí y no en el script de despliegue porque el servidor hace
# `docker compose up -d --no-build`: no tiene el código ni ejecuta npm. Dentro
# del contenedor está todo lo necesario, y el paso no se lo puede saltar quien
# despliegue a mano.
#
# `set -e` corta el arranque si una migración falla. Eso deja sin login a toda
# la plataforma —y rompe la inscripción de cursos, que llama a este servicio—,
# que es más ruidoso que en otros sitios pero sigue siendo lo correcto: una base
# a medias sirviendo cuentas es peor que un login caído y visible.
#
set -e

echo "[entrypoint] Aplicando migraciones pendientes…"
npm run migration:run
echo "[entrypoint] Esquema al día. Arrancando la aplicación."

# `exec` para que node sea el proceso principal y reciba las señales de parada:
# sin esto, un `docker stop` no llegaría a la aplicación.
exec node dist/main
