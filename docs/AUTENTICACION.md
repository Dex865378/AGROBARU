# Autenticación empresarial y roles — AgroBarú

## Rutas

| Ruta | Acceso | Contenido |
| --- | --- | --- |
| `/login` | Público | Correo/contraseña, Google, recuperar contraseña |
| `/registro` | Público | Nombre completo, comunidad de Barú, correo y contraseña |
| `/seleccionar-rol` | Autenticado sin rol | Puerta obligatoria: Productor Agrícola o Comprador-Consumidor |
| `/productor` | Rol `productor` | Interfaz completa, sección de productor (Bitácora y publicación) |
| `/mercado` | Rol `consumidor` | Interfaz completa, catálogo y pedido Escrow |
| `/perfil` | Autenticado | Cuenta, UID, cambio de rol y cierre de sesión |
| `/` y `/trace/*` | Público | Sitio institucional existente (prototipo) |

## Estado del despliegue

- Hosting: **https://mapache-4ab0f.web.app**
- Entrada `/`: acceso empresarial (correo/contraseña, crear cuenta y Google).
- Sitio público: `/sitio`. Trazabilidad QR: `/trace/*`.
- Reglas de Firestore publicadas en `mapache-4ab0f`.
- **Correo electrónico/Contraseña** y **Google** habilitados.
- Tras elegir rol se carga la interfaz completa original; el selector de rol y el cambio de cuenta simulado quedan ocultos.
- Dominios autorizados: `localhost`, `mapache-4ab0f.firebaseapp.com`,
  `mapache-4ab0f.web.app`, `agrobaru.com` y `www.agrobaru.com`.
  El dominio `agrobaru.com` aún no está conectado al Hosting; la URL activa es
  la de `.web.app`.

Para volver a desplegar:

```bash
npm run build
npx firebase deploy --only hosting,firestore:rules --project mapache-4ab0f
```

## Datos

- `users/{uid}`: `uid`, `name`, `email`, `community`, `role` (`null`,
  `productor` o `consumidor`), `photoURL`, `createdAt`, `updatedAt`.
- `products/{id}`: `producerId`, datos del lote, `priceUsd`, `status`,
  `community`, `gps` (opcional), `traceabilityHash` SHA-256 de 64 caracteres
  hexadecimales, `createdAt`, `updatedAt`.

La sesión usa `browserLocalPersistence`; Firestore usa caché persistente
multipestaña. Si se pierde la conexión, la sesión, el perfil y las cosechas
siguen visibles y las escrituras se sincronizan al reconectar.

## Reglas de seguridad incluidas

```text
match /users/{userId} {
  allow read:   if request.auth != null && request.auth.uid == userId;
  allow create, update: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.uid == userId
    && (request.resource.data.role == null
      || request.resource.data.role in ['productor', 'consumidor']);
  allow delete: if false;
}

match /products/{productId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null
    && request.resource.data.producerId == request.auth.uid
    && request.resource.data.priceUsd is number
    && request.resource.data.priceUsd > 0
    && request.resource.data.quantity is number
    && request.resource.data.quantity > 0
    && request.resource.data.status in ['disponible', 'en_cosecha']
    && request.resource.data.traceabilityHash.matches('^[0-9a-f]{64}$');
  allow update: if request.auth != null
    && resource.data.producerId == request.auth.uid
    && request.resource.data.producerId == resource.data.producerId;
  allow delete: if request.auth != null
    && resource.data.producerId == request.auth.uid;
}
```

## Pruebas con emuladores

```bash
npx firebase emulators:start --only auth,firestore --project demo-agrobaru
VITE_USE_FIREBASE_EMULATORS=true npm run dev
```

Sin la variable `VITE_USE_FIREBASE_EMULATORS` la aplicación usa el proyecto
real. El emulador se levanta en Auth `9099` y Firestore `8080`.

## Verificación realizada

- Registro → selección de rol → panel de productor.
- Publicación, edición, eliminación y persistencia tras recargar.
- Cambio a consumidor: catálogo sin controles de edición.
- Recarga sin conexión: sesión, perfil y cosechas desde caché; escritura
  offline sincronizada al reconectar (Service Worker + IndexedDB).
- Captura de GPS y hash SHA-256 verificados en Firestore.
- `tsc --noEmit` y `npm run build` sin errores.
