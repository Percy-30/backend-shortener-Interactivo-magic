# backend-shortener-Interactivo-magic 🪄

Acortador de URLs personalizado para el proyecto **Interactivo Magic**.

## ✨ Características
- **Expiración de 30 días**: Los enlaces se eliminan automáticamente de la base de datos tras 30 días.
- **Sin Anuncios**: Redireccionamiento instantáneo y directo.
- **Vercel Native**: Optimizado para funcionar como Serverless Functions.
- **Base de Datos**: Utiliza Upstash Redis para persistencia gratuita y rápida.

## 🚀 Despliegue en Vercel
1. Conecta este repositorio a un nuevo proyecto en Vercel.
2. Configura las siguientes variables de entorno:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Vincula el dominio `s.ftydownloader.com`.

## 🛠️ Desarrollo Local
1. Instala dependencias: `npm install`
2. Crea un archivo `.env` con las credenciales de Upstash.
3. Ejecuta: `npm run dev`
