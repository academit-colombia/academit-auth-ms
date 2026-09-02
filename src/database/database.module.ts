import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KeyPair } from 'src/auth/entities/key-pair/key-pair';
import { Usuario } from 'src/auth/entities/usuario/usuario.entity';
import { CodigoVerificacion } from 'src/auth/entities/codigo/codigo-verificacion.entity';
import { SolicitudCambioDatos } from 'src/auth/entities/solicitud-cambio-datos/solicitud-cambio-datos.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hacer que ConfigModule esté disponible en toda la aplicación
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isMySQL = configService.get<string>('DB_TYPE') === 'mysql';

        return {
          type: isMySQL ? 'mysql' : 'sqlite',
          host: isMySQL ? configService.get<string>('DB_HOST') : undefined,
          port: isMySQL ? +configService.get<number>('DB_PORT') : undefined,
          username: isMySQL
            ? configService.get<string>('DB_USERNAME')
            : undefined,
          password: isMySQL
            ? configService.get<string>('DB_PASSWORD')
            : undefined,
          database: configService.get<string>('DB_DATABASE'),
          entities: [KeyPair, Usuario, CodigoVerificacion, SolicitudCambioDatos],
          /*
           * Contra MySQL —producción— apagado: el esquema lo construyen las
           * migraciones de src/migrations/, que el entrypoint aplica al arrancar
           * el contenedor.
           *
           * Estuvo en `true` con un comentario que decía «No usar en
           * producción», y se usaba en producción. Con él, TypeORM ejecutaba en
           * cada arranque los `ALTER` que le parecieran para que la base se
           * pareciese a las entidades, sin que nadie los revisara. Sobre la base
           * que guarda las cuentas y sin copias de seguridad automáticas.
           *
           * El caso destructivo está comprobado, no supuesto: quitando la
           * propiedad `biografia` de la entidad y arrancando, la columna y su
           * contenido desaparecían de la base. Basta un merge que se lleve unas
           * líneas por delante. (Renombrar, en cambio, resultó ser seguro:
           * TypeORM empareja la columna que sobra con la que falta y emite un
           * `CHANGE COLUMN`. Pero solo acierta cuando el emparejamiento es
           * inequívoco.)
           *
           * Va atado al dialecto y no a una variable de entorno a propósito: una
           * variable sería el mismo agujero con un interruptor que alguien puede
           * poner a `true` en el servidor.
           *
           * En SQLite se deja encendido porque ahí el esquema se recrea de cero
           * en cada arranque y no hay ningún dato que perder; las migraciones son
           * SQL de MySQL y no correrían. Nota: hoy esa rama no arranca de todos
           * modos —`Usuario.rol` es un `enum`, que SQLite no soporta—, cosa que
           * ya pasaba antes de este cambio.
           */
          synchronize: !isMySQL,
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
