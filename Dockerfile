# Imagen base de Node.js
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Instala dependencias
COPY package*.json ./
RUN npm install

# Copia el resto del código y compila
COPY . .
RUN npm run build

# Puerto en el que escucha la app (ver PORT en src/main.ts)
EXPOSE 3000

# El arranque pasa por entrypoint.sh, que aplica las migraciones pendientes
# antes de levantar la aplicación: desde que `synchronize` está apagado contra
# MySQL, es lo único que mantiene el esquema al día.
RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
