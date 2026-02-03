# Instrucciones para el Acortador Profesional con Upstash (Vercel) 🚀

¡Ya creaste tu base de datos! Ahora vamos a conectarla con Vercel para que `s.ftydownloader.com` funcione perfectamente.

## 1. Copia tus Llaves de Upstash
En tu panel de Upstash (donde estás ahora):
1. Selecciona la pestaña **REST**.
2. Copia el **URL** (ej: `https://ready-basilisk-45325.upstash.io`).
3. Copia el **Token** (haz clic en el botón de copiar al lado de los puntos).

## 2. Configura Vercel
1. Sube esta carpeta (`backend-shortener`) a Vercel como un proyecto nuevo.
2. En el panel de Vercel (Settings -> Environment Variables), añade estas dos:
   *   `UPSTASH_REDIS_REST_URL` = (Pega el URL que copiaste)
   *   `UPSTASH_REDIS_REST_TOKEN` = (Pega el Token que copiaste)
3. Ve a **Settings -> Domains** y añade `s.ftydownloader.com`.

## 3. ¡Listo! 🪄
Tu aplicación principal ya sabe que debe usar este servidor para crear los links cortos de 30 días. ¡Todo será automático y profesional!

