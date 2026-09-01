import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * El esquema de `academit_auth` tal como estaba el día que dejó de construirse
 * solo.
 *
 * Hasta aquí las tablas las creaba `synchronize: true` en cada arranque, sin que
 * nadie revisara los `ALTER` que ejecutaba. Esta migración congela lo que había
 * —no cambia ni una columna— para que a partir de ahora el esquema se mueva solo
 * por migraciones.
 *
 * Tres detalles deliberados:
 *
 * `IF NOT EXISTS`, para que aplicarla sobre la base de producción, que ya tiene
 * las tres tablas con las cuentas dentro, no ejecute absolutamente nada. Así la
 * base queda adoptada sin que nadie entre al servidor a marcar la migración a
 * mano, que es el paso que se olvida.
 *
 * La colación va escrita, no heredada. En `correccion-de-errores-cursos` la
 * migración que creó `comentario` no la declaró: la heredó de la base, que es
 * `utf8mb4_unicode_ci` donde la crea `00-databases.sql` pero
 * `utf8mb4_0900_ai_ci` en un MySQL levantado sin él. El esquema dejaba de ser
 * reproducible y hubo que arreglarlo con otra migración. Estas tres tablas
 * estaban hoy en ese mismo estado.
 *
 * Y el cuerpo salió de `migration:generate` contra una base vacía, no de
 * transcribir un volcado. Se puede porque `synchronize` mantenía la base
 * alineada con las entidades, así que lo que TypeORM genera desde ellas es lo
 * que hay en producción. Transcribir a mano solo habría añadido ocasiones de
 * fallar: el único de `email` se llama `IDX_2863682842e688ca198eb25c12`, las
 * columnas de `key_pair` van en camelCase, y en `codigo_verificacion` conviven
 * `expira_en` en `datetime` con `created_at` en `datetime(6)`.
 */
export class Baseline1788295063550 implements MigrationInterface {
  name = 'Baseline1788295063550';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS `key_pair` (' +
        '`id` int NOT NULL AUTO_INCREMENT, ' +
        '`apikey` varchar(255) NOT NULL, ' +
        '`privateKey` text NOT NULL, ' +
        '`isActive` tinyint NOT NULL DEFAULT 1, ' +
        '`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), ' +
        '`updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), ' +
        '`clientIp` varchar(255) NULL, ' +
        '`failedAttempts` int NOT NULL DEFAULT 0, ' +
        'PRIMARY KEY (`id`)' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );

    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS `usuario` (' +
        '`id_usuario` int NOT NULL AUTO_INCREMENT, ' +
        '`nombre` varchar(255) NOT NULL, ' +
        '`email` varchar(255) NOT NULL, ' +
        '`password_hash` varchar(255) NULL, ' +
        "`rol` enum ('administrador', 'profesor', 'estudiante') NOT NULL DEFAULT 'estudiante', " +
        '`telefono` varchar(30) NULL, ' +
        '`fecha_nacimiento` date NULL, ' +
        '`pais_residencia` varchar(2) NULL, ' +
        '`ciudad` varchar(120) NULL, ' +
        '`documento_identidad` varchar(40) NULL, ' +
        "`genero` enum ('femenino', 'masculino', 'otro', 'prefiero_no_decir') NULL, " +
        '`biografia` text NULL, ' +
        '`ruta_foto` varchar(255) NULL, ' +
        '`email_verificado` tinyint NOT NULL DEFAULT 0, ' +
        '`activo` tinyint NOT NULL DEFAULT 1, ' +
        '`created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), ' +
        '`updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), ' +
        // El nombre lo generó TypeORM a partir de `unique: true` en la columna.
        // Tiene que conservarse: si se le pusiera un nombre propio, TypeORM lo
        // vería como otro índice y propondría crear uno más al lado.
        'UNIQUE INDEX `IDX_2863682842e688ca198eb25c12` (`email`), ' +
        'PRIMARY KEY (`id_usuario`)' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );

    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS `codigo_verificacion` (' +
        '`id_codigo` int NOT NULL AUTO_INCREMENT, ' +
        // Sin clave foránea a `usuario` a propósito: no la hay en la base y
        // añadirla aquí sería cambiar el esquema, que es justo lo que este
        // baseline no hace.
        '`id_usuario` int NOT NULL, ' +
        '`codigo_hash` varchar(255) NOT NULL, ' +
        '`expira_en` datetime NOT NULL, ' +
        '`intentos` int NOT NULL DEFAULT 0, ' +
        '`usado_en` datetime NULL, ' +
        '`created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), ' +
        'INDEX `IDX_codigo_usuario` (`id_usuario`), ' +
        'PRIMARY KEY (`id_codigo`)' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );
  }

  /**
   * Los índices se van con su tabla, así que no hace falta borrarlos aparte.
   * No hay claves foráneas entre las tres, pero se dejan en orden inverso al de
   * creación por costumbre.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `codigo_verificacion`');
    await queryRunner.query('DROP TABLE IF EXISTS `usuario`');
    await queryRunner.query('DROP TABLE IF EXISTS `key_pair`');
  }
}
