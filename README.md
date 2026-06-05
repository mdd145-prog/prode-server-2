# Prode Bot 2026 — Servidor

Bot de WhatsApp (Baileys) + Supabase + football-data.org para el Prode del Mundial 2026.

## Variables de entorno necesarias

Crear un archivo `.env` (o configurarlas en Render):

```
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_KEY=service_role_key_secreta   # ⚠️ debe ser la service_role, NO la anon
GROUP_ID=id_del_grupo@g.us              # grupo de WhatsApp destino
ADMIN_JID=549XXXXXXXXXX@s.whatsapp.net  # número del admin (opcional, tiene default)
FOOTBALL_API_KEY=tu_api_key_de_football-data.org
FOOTBALL_COMPETITION=WC                 # WC = Mundial (cambiar solo para pruebas)
ODDS_API_KEY=tu_key_de_the-odds-api     # opcional, para !proba
ADMIN_TOKEN=token_secreto_largo         # protege los endpoints /admin/*
PORT=3000
```

> **Seguridad:** los endpoints `/admin/*` requieren el header `x-admin-token: $ADMIN_TOKEN`.
> Sin `ADMIN_TOKEN` configurado, esos endpoints quedan deshabilitados (503).
> Las políticas RLS de la base están en `sql/rls.sql` — correrlas en el SQL Editor de Supabase.

## Comandos del bot en el grupo

- `!tabla` → Tabla NO OFICIAL como imagen (con partidos en vivo)
- `!hoy` → Partidos del día con pronósticos (imagen)
- `!dia YYYY-MM-DD` → Partidos de una fecha (imagen)
- `!chances` → Quién sigue en carrera
- `!ayuda` → Lista de comandos

### Comandos solo admin

- `!oficial` → Tabla oficial (preview en privado, al grupo si se manda desde el grupo)
- `!resumen` → Manda el resumen del día al grupo
- `!forzar` → Manda la tabla oficial al grupo
- `!sync` → Fuerza sincronización con la API de resultados
- `!resultado Equipo1 g1 Equipo2 g2` → Carga un resultado a mano
- `!estado` → Estado del bot

## Comportamiento automático

- Polling de resultados cada 2 minutos vía football-data.org
- Cuando termina un partido → manda resultado con puntos + tabla oficial
- Cron 8am (hora Argentina) → manda el resumen del día si hay partidos

## Endpoints

- `GET /qr` → QR para vincular WhatsApp
- `GET /preview/oficial|nooficial|chances|dia|proba` → preview de imágenes
- `POST /admin/sync` → carga masiva de jugadores/pronósticos (requiere `x-admin-token`)

## Deploy en Render

1. Subir este repositorio a GitHub
2. En Render → New Web Service → conectar repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Agregar todas las variables de entorno
