/**
 * Comprueba que el esquema que producen las migraciones coincide con lo que
 * describen las entidades. Pensado para correr en integración continua sobre un
 * MySQL vacío al que ya se le aplicaron todas las migraciones.
 *
 * Sale con código 1 si queda algo pendiente.
 *
 * Aquí importa más que en `griselda-backend`. Hasta ahora `synchronize: true`
 * propagaba a la base cualquier cambio de entidad, así que olvidarse de la
 * migración no tenía consecuencias: no existían las migraciones. Desde que está
 * apagado, una entidad cambiada sin su migración deja de reflejarse en la base y
 * las consultas empiezan a fallar en producción, en silencio. Este job es lo que
 * convierte ese fallo en un build rojo.
 *
 * La comparación la hace `createSchemaBuilder().log()`, que usa los metadatos
 * reales de TypeORM —no un análisis del texto de los archivos de entidad—, así
 * que ve lo mismo que vería `migration:generate`.
 */
import { AppDataSource } from './data-source';

/** `CREATE TABLE \`x\`` -> x */
const tablasAusentes = (consultas: string[]): string[] =>
  consultas
    .map((q) => /^\s*CREATE TABLE\s+`([^`]+)`/i.exec(q)?.[1])
    .filter((t): t is string => Boolean(t));

/** ``ALTER TABLE `x` ADD `col` …`` -> x.col */
const columnasAusentes = (consultas: string[]): string[] =>
  consultas
    .map((q) => {
      const m = /^\s*ALTER TABLE\s+`([^`]+)`\s+ADD\s+`([^`]+)`/i.exec(q);
      return m ? `${m[1]}.${m[2]}` : undefined;
    })
    .filter((c): c is string => Boolean(c));

async function main(): Promise<void> {
  await AppDataSource.initialize();
  try {
    const { upQueries } = await AppDataSource.driver
      .createSchemaBuilder()
      .log();
    const consultas = upQueries.map((q) => q.query);

    if (consultas.length === 0) {
      console.log(
        '[deriva] Las entidades y el esquema coinciden: nada pendiente.',
      );
      return;
    }

    const tablas = tablasAusentes(consultas);
    const columnas = columnasAusentes(consultas);

    console.error(
      `[deriva] El esquema no coincide con las entidades: ` +
        `${consultas.length} cambio(s) pendiente(s).`,
    );
    if (tablas.length) {
      console.error(`[deriva] Faltan estas TABLAS: ${tablas.join(', ')}`);
    }
    if (columnas.length) {
      console.error(`[deriva] Faltan estas COLUMNAS: ${columnas.join(', ')}`);
    }
    console.error('[deriva] Lo que haría falta ejecutar:');
    consultas.forEach((q) => console.error(`  ${q.replace(/\s+/g, ' ')}`));
    console.error(
      '\n[deriva] Genera la migración que falta con:\n' +
        '  npm run migration:generate -- src/migrations/NombreDelCambio',
    );
    process.exitCode = 1;
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error('[deriva] No se pudo comprobar el esquema:', error);
  process.exit(1);
});
