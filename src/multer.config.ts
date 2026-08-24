import { MulterModuleOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

const EXTENSIONES_PERMITIDAS = /\.(jpg|jpeg|png|webp|gif)$/i;

/**
 * Almacenamiento de las fotografías de perfil.
 *
 * Se guardan en `uploads/usuarios/` y se sirven en `/uploads/usuarios/**` con
 * ServeStaticModule, igual que hace griselda-backend con sus imágenes.
 */
export const multerConfigUsuarios: MulterModuleOptions = {
  storage: diskStorage({
    destination: './uploads/usuarios',
    filename: (_req, file, cb) => {
      // Prefijo temporal para que dos usuarios con el mismo nombre de archivo
      // no se pisen entre sí.
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!EXTENSIONES_PERMITIDAS.test(extname(file.originalname))) {
      return cb(
        new BadRequestException('La fotografía debe ser JPG, PNG, WEBP o GIF.'),
        false,
      );
    }
    cb(null, true);
  },
};
