# Prode Bot 2026 — Servidor

## Variables de entorno necesarias

Crear un archivo `.env` con:

```
SUPABASE_URL=https://pgapjiunfbltefklhcwm.supabase.co
SUPABASE_KEY=tu_supabase_secret_key
WA_TOKEN=tu_meta_token
WA_PHONE_ID=1065187280019385
WA_BUSINESS_ID=980297514379405
WA_VERIFY_TOKEN=prode2026verify
APISPORTS_KEY=tu_api_sports_key
GROUP_ID=id_del_grupo_de_whatsapp
PORT=3000
```

## Comandos del bot en el grupo

- `!tabla` → Tabla de posiciones en texto
- `!oficial` → Tabla oficial como imagen JPG
- `!hoy` → Partidos del día con pronósticos
- `!ayuda` → Lista de comandos

## Comportamiento automático

- Detecta goles cada 2 minutos via API-Sports
- Cuando termina un partido → manda resultado con puntos
- Manda tabla oficial actualizada automáticamente

## Deploy en Render

1. Subir este repositorio a GitHub
2. En Render → New Web Service → conectar repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Agregar todas las variables de entorno
6. Copiar la URL del servidor para configurar el webhook de Meta
