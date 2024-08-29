import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KeyPair } from 'src/auth/entities/key-pair/key-pair';

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
          entities: [KeyPair],
          synchronize: true, // No usar en producción
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
