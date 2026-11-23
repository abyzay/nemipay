# NemiPay

Aplicación móvil mexicana enfocada en que pequeños y medianos negocios (taquerías, tiendas de abarrotes, restaurantes, comercios pequeños y profesionistas independientes) reciban pagos mediante **CoDi**.

> **Nota de alcance del producto:** NemiPay **no** es una billetera digital, **no** permite enviar dinero entre usuarios y **no** sustituye a las aplicaciones bancarias. Es una herramienta especializada para recibir pagos, administrar cobros y consultar las operaciones del negocio.

---

## Estado actual

**Etapa 1 — Infraestructura técnica lista y validada.**

Esta etapa contiene exclusivamente la base técnica del proyecto (arquitectura modular, sistema de diseño, capa HTTP sobre `fetch`, configuración fintech de TanStack Query, envoltorios de seguridad y suite inicial de pruebas). No incluye pantallas funcionales ni integración CoDi todavía.

---

## Stack tecnológico

- **Core:** Expo `~58.0.26` (SDK 58), React Native `0.88.1`, React `19.3.0`, TypeScript `~6.0.3` (strict mode).
- **Navegación:** Expo Router `~58.0.32` (`typedRoutes` habilitado).
- **UI y diseño:** React Native Paper `^5.15.5` (MD3), React Native Safe Area Context `~5.11.1`, React Native SVG `15.16.0`, Lucide React Native `^1.78.0`, `@expo-google-fonts/inter` `^0.4.2`, React Native QRCode SVG `^6.3.54`.
- **Datos y estado:** TanStack Query `^5.108.4` + Fetch API nativa (sin Axios), Zustand `^5.1.0` (solo estado visual/local de UI).
- **Formularios y validación:** React Hook Form `^7.92.0`, Zod `^4.6.7`, `@hookform/resolvers` `^7.0.8`.
- **Seguridad y notificaciones:** Expo SecureStore `~58.0.3`, Expo Local Authentication `~58.0.3`, Expo Crypto `~58.0.8`, Expo Notifications `~58.1.9`, Expo Device `~58.0.5`.
- **Calidad y pruebas:** ESLint `^9.39.5` (`eslint-config-expo`), Prettier `^3.10.1`, Jest `~30.5.2`, `jest-expo` `~58.0.15`, `@testing-library/react-native` `^14.1.0`.

---

## Identidad visual oficial

| Variable       | Color     |
| -------------- | --------- |
| Primary        | `#087F5B` |
| Primary Dark   | `#064E3B` |
| Secondary      | `#DDF5EA` |
| Background     | `#F7FAF8` |
| Surface        | `#FFFFFF` |
| Text Primary   | `#202B26` |
| Text Secondary | `#78857E` |
| Border         | `#E7EDE9` |
| Success        | `#15966A` |
| Warning        | `#E8A23A` |
| Error          | `#D64545` |

Tipografía base: **Inter** (`400`, `500`, `600`, `700`).

---

## Arquitectura del proyecto

```text
NemiPay/
├── app/                   # Rutas y layouts de Expo Router ((auth), (tabs), collect)
├── src/
│   ├── components/        # Componentes compartidos (layout/AppProviders, ui/)
│   ├── config/            # Validación de entorno (Zod) y QueryClient fintech
│   ├── constants/         # Constantes globales no sensibles
│   ├── features/          # Módulos por dominio: authentication, business, movements, payments, profile, reports
│   ├── hooks/             # Hooks transversales (useAppTheme)
│   ├── services/          # Capa API sobre fetch, seguridad (SecureStore/biometría/crypto) y notificaciones
│   ├── stores/            # Zustand exclusivo para estado de UI
│   ├── theme/             # Paleta, tipografía Inter, espaciado, radios, elevaciones y tema Paper MD3
│   ├── types/             # Tipos base compartidos
│   └── utils/             # Logger seguro con redacción de campos sensibles
├── __tests__/             # Pruebas iniciales de infraestructura
├── assets/                # Imágenes, íconos y fuentes
├── .env.example           # Plantilla de variables públicas de entorno
├── app.config.ts          # Configuración dinámica por ambiente (development / production)
├── app.json               # Configuración base de Expo y config plugins
└── eas.json               # Perfiles iniciales de EAS Build
```

---

## Configuración inicial

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea tu archivo `.env` a partir de la plantilla:

   ```bash
   cp .env.example .env
   ```

   > **Advertencia de seguridad:** Nunca coloques secretos privados, llaves privadas de API o contraseñas en variables con prefijo `EXPO_PUBLIC_`.

3. Scripts disponibles:

   ```bash
   npm start            # Inicia Expo Dev Server
   npm run android      # Inicia en Android
   npm run ios          # Inicia en iOS
   npm run typecheck    # Ejecuta tsc --noEmit
   npm run lint         # Ejecuta expo lint
   npm run format       # Formatea el código con Prettier
   npm run format:check # Verifica formato con Prettier
   npm test             # Ejecuta la suite de Jest
   ```

---

## Principios de seguridad financiera

- **Sin Axios:** Toda comunicación HTTP utiliza la Fetch API nativa en `src/services/api/client.ts` con soporte de `AbortController`, timeouts y validación opcional con Zod.
- **Sin duplicidad de cobros:** `mutations.retry` está fijado en `false` en TanStack Query y se incluye soporte de `Idempotency-Key` generado mediante `expo-crypto`.
- **Confirmación autoritativa en backend:** La aplicación móvil nunca determina por sí sola que un pago fue recibido; toda confirmación proviene del backend tras validar la operación financiera.
- **Almacenamiento seguro:** Tokens y preferencias sensibles utilizan `expo-secure-store`; nunca se almacenan contraseñas locales ni se registran tokens en logs.
