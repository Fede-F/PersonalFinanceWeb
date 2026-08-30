# Project Context: Finance Web App (SaaS Ready)

## 1. Project Vision & Roadmap
Una aplicación web de finanzas personales escalable, segura y colaborativa con enfoque **Mobile-first (PWA)** y **Multi-tenant**.

### 📌 Roadmap & Estado de Implementación:
- [x] **Fase 1: Core de Gastos y Flujo de Fondos (COMPLETADA)**
  - Gestión de Workspaces compartidos e individuales.
  - Registro de gastos/ingresos comunes, fijos y en cuotas (tarjetas de crédito).
  - Normalización multimoneda con tasas de cambio en tiempo real (`market_rates`).
  - Gráficos interactivos en Recharts (Distribución de Gastos y Capacidad de Ahorro).
  - PWA instalable con Service Worker nativo (`/manifest.webmanifest`, `/sw.js`).
  - Navegación responsive: Header sin sidebar en PC + Barra inferior con botón central `+` en Mobile.
- [x] **Fase 2: Gestión Activa de Inversiones y Portafolios (COMPLETADA)**
  - Seguimiento en vivo de **Criptomonedas**, **Acciones de USA** y **CEDEARs**.
  - **Buscador en Vivo Inteligente (`AssetSearchCombobox`)**: Búsqueda simultánea en Yahoo Finance y CoinGecko con autocompletado y catálogo de recientes.
  - **Cálculo Bidireccional:** Conexión en tiempo real entre Cantidad, Precio Unitario y Total Invertido.
  - **Sincronización con Gastos:** Opción de descontar del balance del workspace (`linkedTransactionId`).
  - **Edición y Eliminación en Historial (`EditInvestmentModal`):** Actualización en cascada del gasto vinculado.
  - **Gráficos Recharts:** Evolución temporal de cartera (`PortfolioChart`) y Donut de Distribución (`AssetAllocationDonut`).
  - **Switch Multimoneda (`[ Moneda Base | USD ]`):** Adaptación en vivo de KPIs, gráficos, tablas y precarga de formularios.
  - **Modo Privacidad Global (👁️):** Enmascaramiento de saldos (`••••••`) con persistencia en `localStorage`.
  - **Micro-interacciones y Haptic Feedback:** Vibraciones suaves (6-8ms), compresión física (`active:scale-95`) y selector de período optimista en 0ms.
  - **Paginación Progresiva:** Carga por scroll infinito (`IntersectionObserver`) y filtros rápidos táctiles (Pills).
  - **Seguridad:** Cifrado AES-256-CBC de valores numéricos en Postgres.
- [ ] **Fase 3: Gestión de Miembros y Permisos** (Invitaciones a workspaces, roles OWNER/EDITOR/VIEWER).
- [ ] **Fase 4: Inteligencia Financiera y Metas** (Cash Flow proyectado, presupuestos automáticos y compactación de históricos).

---

## 2. Tech Stack
- **Framework:** Next.js 16 (App Router + Turbopack).
- **Lenguaje:** TypeScript (Strict Mode).
- **Estilos & UI:** Tailwind CSS v4 + Shadcn/UI + Lucide Icons.
- **Gráficos:** Recharts.
- **Base de Datos:** PostgreSQL + Drizzle ORM (con migraciones).
- **Autenticación:** NextAuth.js v5 (Auth.js) con sesiones JWT y credenciales/OAuth.
- **PWA:** Service Worker (`public/sw.js`), Manifiesto (`src/app/manifest.ts`), Cache de assets estáticos y soporte offline.
- **Criptografía:** Node.js `crypto` con AES-256-CBC para cifras monetarias sensibles.

---

## 3. Arquitectura y Reglas del Negocio

### 🏢 Multi-tenancy basado en Workspaces
* La unidad de aislamiento de datos es el `workspace_id`.
* Todo registro de transacciones, posiciones y categorías pertenece a un workspace.
* Un usuario global (`users`) puede acceder a N workspaces según `workspace_members`.

### 💱 Manejo Multimoneda & Cotizaciones
* **Tasas Fiat y Cripto:** Tabla `market_rates` almacena las cotizaciones globales más recientes (ej: `USD/ARS`, `EUR/USD`).
* **Cache de Activos de Mercado (`asset_market_prices`):** Caching global en Postgres con TTL de 15 minutos para minimizar peticiones a Yahoo Finance / CoinGecko.
* **Histórico Inmutable (`asset_price_history`):** Snapshots diarios fijos por activo para graficar evolución histórica sin reconsultar APIs externas.

### 🔒 Seguridad y Cifrado
* Los campos `amount`, `quantity`, `unitPrice`, `totalAmount`, `fees` se cifran en el backend mediante AES-256-CBC antes de guardarse en la base de datos.
* El frontend nunca maneja claves de cifrado; recibe los valores descifrados desde Server Components o Server Actions autorizadas.

---

## 4. Estructura de Rutas y Componentes Clave

```
src/
├── app/
│   ├── (auth)/              # Login y Registro
│   ├── dashboard/           # Módulo de Gastos y Flujo de Fondos (Fase 1)
│   ├── investments/         # Módulo de Portafolio de Inversiones (Fase 2)
│   └── actions/             # Server Actions (dashboard, investments, transactions)
├── components/
│   ├── investments/         # Buscador en vivo, KPIs, Gráficos, Holdings, Historial y Modales
│   ├── ui/                  # Componentes base Shadcn (Button, Dialog, Dropdown, etc.)
│   ├── privacy-provider.tsx # Contexto y Toggle de Modo Privacidad
│   ├── period-selector.tsx  # Selector de período mensual con carga optimista
│   └── mobile-bottom-nav.tsx# Barra de navegación inferior fija para PWA/Mobile
└── lib/
    ├── crypto.ts            # Cifrado AES-256-CBC
    ├── haptics.ts           # Micro-vibraciones hápticas táctiles
    └── investment-rates.ts  # Clientes de APIs de mercado (Yahoo Finance & CoinGecko)
```

---

## 5. Guía Rápida para Desarrolladores e IA
1. **Mobile-First:** Toda pantalla o componente debe diseñarse y probarse primero en dimensiones de celular ($360\text{px} - 430\text{px}$) y luego adaptarse a Desktop.
2. **Type Safety:** No utilizar `any` salvo excepciones explícitamente documentadas.
3. **Cálculos Financieros:** Conservar la consistencia bidireccional entre la moneda base del workspace y USD.
4. **Build & Test:** Verificar siempre con `npx tsc --noEmit` y `npm run build` antes de finalizar tareas.