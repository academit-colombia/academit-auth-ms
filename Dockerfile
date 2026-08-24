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

# Ejecuta el build ya compilado en dist/, no el CLI de Nest en modo dev
CMD ["npm", "run", "start:prod"]
