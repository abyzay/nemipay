# NemiPay

Cobro **CoDi** gratis y sin configuración para negocios pequeños de todo tipo (tiendas, taquerías, fruterías, peluquerías, puestos de tianguis y servicios). Web-first con **Expo SDK 58** (`expo export -p web`) y backend completo en **Supabase** + **Pey**.

> **Nota de alcance:** NemiPay es agnóstico al giro: cobra un monto libre o una lista simple de productos o servicios (nombre y precio), muestra el QR CoDi en vivo y confirma por pantalla verde y voz (`es-MX`).

---

## Arquitectura

- **Frontend (`app/`, `src/`):** Expo Router (3 tabs: `Cobrar`, `Hoy`, `Cuenta`), React Native Web, React Native Paper, TanStack Query (`mutations.retry: false`), Zustand (solo estado UI y deduplicación de anuncios de voz), Zod y `expo-speech` / `expo-keep-awake`.
- **Backend (`supabase/`):**
  - **Postgres + RLS:** `merchants`, `products` (borrado lógico `active = false`), `charges` (solo `SELECT` desde cliente; escritura exclusiva vía `apply_charge_transition` y `service_role`), `webhook_events` (solo `service_role`).
  - **Funciones SQL:** `apply_charge_transition`, `charges_today()`, `daily_summary()` en zona `America/Mexico_City`.
  - **Realtime:** suscripción en vivo a actualizaciones de `charges`.
  - **Edge Functions (Deno):** `create-charge`, `check-charge`, `cancel-charge`, `pey-webhook` (Standard Webhooks), `reconcile-charges`.
  - **Cron (`pg_cron` + `pg_net` + Vault):** reconciliación periódica de cobros pendientes y expirados.

---

## Variables de entorno

Copia `.env.example` a `.env` y completa las variables públicas del cliente:

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-publishable-key>
EXPO_PUBLIC_API_TIMEOUT_MS=15000
EXPO_PUBLIC_MAX_CHARGE_CENTS=9999900
```

> **Seguridad:** Nunca coloques `SUPABASE_SERVICE_ROLE_KEY`, `PEY_API_KEY`, `PEY_WEBHOOK_SECRET` ni `CRON_SECRET` en variables `EXPO_PUBLIC_*`.

---

## Desarrollo local y pruebas

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run functions:test   # requiere Deno
npm run build:web        # genera dist/ estático para despliegue web
```

Para base de datos local (requiere Docker Desktop + Supabase CLI):

```bash
npm run db:start
npm run db:reset
npm run db:lint
npm run db:test          # ejecuta pruebas pgTAP en supabase/tests/
npm run db:types         # regenera src/types/database.ts
```

---

## Despliegue en Supabase Cloud y Web

1. Enlaza el proyecto y sube migraciones:

   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

2. Configura secretos de Edge Functions (nunca con prefijo `SUPABASE_`):

   ```bash
   npx supabase secrets set \
     PEY_API_KEY=<api-key> \
     PEY_BASE_URL=https://api.pey.mx \
     PEY_WEBHOOK_SECRET=<whsec_...> \
     ALLOWED_ORIGINS=https://tu-dominio.com \
     MAX_CHARGE_CENTS=9999900 \
     CHARGE_TTL_SECONDS=600 \
     CRON_SECRET=<secreto-aleatorio> \
     APP_ENV=production
   ```

3. Despliega las Edge Functions:

   ```bash
   npx supabase functions deploy
   ```

4. Configura los secretos del Cron en Vault (en el SQL Editor de Supabase):

   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/reconcile-charges', 'reconcile_charges_url');
   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
   ```

5. Desactiva el registro público en **Auth → Providers → Email** (o usa `config.toml`) y crea la cuenta demo:

   ```bash
   npx tsx scripts/seed-demo.ts
   ```

6. Registra en el panel de Pey la URL pública del webhook:

   ```text
   https://<project-ref>.supabase.co/functions/v1/pey-webhook
   ```

7. Compila y publica el sitio estático web (`npm run build:web` → carpeta `dist/`). Agrega su URL a `ALLOWED_ORIGINS` y a **Site URL** en Supabase Auth.
8. Antes de entregar, revisa **Security Advisor** y **Performance Advisor** en el dashboard de Supabase.
