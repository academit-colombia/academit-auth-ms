import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exception/http-exception.filter';
import { TransactionIdMiddleware } from './common/middleware/transaction-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(new TransactionIdMiddleware().use);

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const errorMessages = errors.map(
          (error) =>
            `${error.property} - ${Object.values(error.constraints).join(
              ', ',
            )}`,
        );
        logger.error(`Errores de validación: ${errorMessages.join('; ')}`);
        return new BadRequestException(errorMessages);
      },
    }),
  );

  // Obtener configuraciones desde variables de entorno con tipo correcto
  const port = configService.get<number>('PORT', 3000);
  const environment = configService.get<string>('NODE_ENV', 'development');
  const appName = configService.get<string>(
    'APP_NAME',
    'Academit Authentication Service',
  );

  const authMethod = 'Bearer Auth (JWT)'; // Método de autenticación usado

  // Configuración de Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Academit Authentication API')
    .setDescription(
      'Este proyecto gestiona la autenticación para Academit. Utiliza técnicas avanzadas de encriptación para proteger las credenciales de usuario y asegurar las comunicaciones.',
    )
    .setVersion('1.0')
    .addBearerAuth() // Añade soporte para JWT usando Bearer Auth
    .build();
  const apiVersion = swaggerConfig.info.version || '1.0';
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);

  // Log detallado al levantar la aplicación (nivel debug)
  logger.debug(`Aplicación "${appName}" en ejecución`);
  logger.debug(`Entorno: ${environment}`);
  logger.debug(`Puerto: ${port}`);
  logger.debug(`Versión de la API: ${apiVersion}`);
  logger.debug(`Método de autenticación: ${authMethod}`);
  logger.debug(`Documentación Swagger disponible en el puerto : ${port}/api`);
  logger.debug(
    'La encriptación está activada para la protección de credenciales de usuario.',
  );
}

bootstrap();
