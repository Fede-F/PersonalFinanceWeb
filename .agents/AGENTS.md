# Project Rules & Saved Context

## Saved Test Credentials
For local testing and validation:
- **Email:** `devtest@example.com`
- **Password:** `Password123!`
- **Default Workspace:** Test Workspace

## Completed Phases
- **Fase 1 (Gastos & Flujo de Fondos):** Completada (workspaces, gastos fijos/cuotas, multimoneda, Recharts, PWA).
- **Fase 2 (Portafolio de Inversiones en Vivo):** Completada (Cripto, USA & CEDEARs con Yahoo Finance/CoinGecko, buscador en vivo con memoria caché, cálculo bidireccional, sincronización de gastos, switch multimoneda `[ Base | USD ]`, modo privacidad `MaskedValue`, gráficos Recharts con lazy loading, micro-vibraciones hápticas, pull-to-refresh y scroll infinito).

## Golden Rules for AI & Developers (Must Follow for All Screens)

### 1. UI / UX & Mobile-First
- **Mobile-First Always:** Diseñar para 360-430px primero y escalar a desktop.
- **Header vs Mobile Nav:** En Mobile, usar barra inferior `MobileBottomNav` con botón central `+`. Ocultar botones de creación superiores duplicados (`hidden sm:inline-flex`).
- **Desktop Hover Tooltips:** Todo ícono o control en el Header debe tener tooltip descriptivo al hacer hover.
- **Spring Press & Haptics:** Todos los botones interactivos llevan `active:scale-95 duration-100 touch-manipulation cursor-pointer select-none` y `triggerHaptic("light")` (6-8ms).
- **Pull-to-Refresh:** Habilitado en pantallas con datos dinámicos en vivo para refrescar vía `router.refresh()`.
- **Transiciones:** Usar `animate-in fade-in duration-300` al cambiar moneda, período o filtros.

### 2. Rendimiento & Caching
- **Skeleton Loaders:** Toda ruta debe tener su `loading.tsx` con componentes `<Skeleton />`.
- **API Caching en Postgres (TTL 15 min):** Consultar siempre `asset_market_prices` antes de consultar APIs externas (Yahoo Finance / CoinGecko). Snapshots diarios inmutables en `asset_price_history`.
- **Caché en Memoria:** Buscadores usan `Map<string, T[]>` para responder en 0ms a consultas repetidas.
- **Paginación Progresiva:** En listas largas, procesar en servidor y renderizar con `IntersectionObserver` de a 15 elementos.
- **Lazy Loading Recharts:** Usar `next/dynamic` (`ssr: false`) para módulos gráficos pesados.
- **Singleton Formatters:** Usar funciones de `src/lib/formatters.ts` (`formatCurrency`, `formatQuantity`, `formatPercentage`).

### 3. Seguridad & Multi-tenancy
- **Workspace Isolation:** Toda entidad DEBE pertenecer a un `workspace_id`.
- **Cifrado AES-256-CBC:** Cifrar valores monetarios sensibles en backend vía `src/lib/crypto.ts` antes de persistir.
- **Modo Privacidad:** Envolver todo monto con `<MaskedValue value="..." />` para soportar `••••••`.

### 4. Tipografía, Multimoneda & WCAG
- **Multimoneda Dual:** KPIs muestran valor en moneda activa y equivalente aproximado en la otra (`≈ $X USD` o `≈ $X ARS`).
- **Alineación Tabular:** Usar siempre `font-mono tabular-nums` en montos, precios y porcentajes.
- **Contraste WCAG AAA:** Textos en modo claro con contrastes reforzados (`text-emerald-700`, `text-rose-700`, `text-amber-800`, `text-blue-800`, `text-purple-800`).
- **Validación:** Zod en formularios de cliente y `safeParse` en Server Actions con toasts de `sonner`.
