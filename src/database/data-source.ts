import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { KeyPair } from '../auth/entities/key-pair/key-pair';
import { Usuario } from '../auth/entities/usuario/usuario.entity';
import { CodigoVerificacion } from '../auth/entities/codigo/codigo-verificacion.entity';
import { SolicitudCambioDatos } from '../auth/entities/solicitud-cambio-datos/solicitud-cambio-datos.entity';

dotenv.config();

/**
 * El `DataSource` que usa el CLI de TypeORM para generar y aplicar migraciones.
 *
 * Vive aparte del `DatabaseModule` de Nest porque el CLI se ejecuta fuera del
 * contenedor de inyección: no hay `ConfigService` del que colgar, así que la
 * configuración se lee del entorno directamente. Los dos apuntan a la misma
 * base y registran las mismas entidades, que es lo que importa para que
 * `migration:generate` compare contra el modelo real.
 *
 * Si se añade una entidad hay que registrarla en los dos sitios: aquí y en
 * `database.module.ts`. Es la única duplicación del cambio, y el job de deriva
 * la detecta —una entidad que falte aquí no aparece en las migraciones—.
 *
 * `synchronize: false` siempre. Este archivo solo se usa contra MySQL.
 *
 * Un único export: el CLI de TypeORM rechaza el archivo si encuentra más de una
 * instancia de `DataSource` exportada, así que no se añade `export default`.
 */
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [KeyPair, Usuario, CodigoVerificacion, SolicitudCambioDatos],
  // En ejecución se cargan los .js compilados; con ts-node, los .ts del fuente.
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
});
