# FinanceWebApp: Reglas y Estándares Globales del Proyecto

Este documento reúne todas las **reglas de diseño, arquitectura, UI/UX, rendimiento y seguridad** que rigen en toda la plataforma. Tanto los desarrolladores como los agentes de IA **deben seguir estas reglas obligatoriamente** en cualquier nueva pantalla o funcionalidad.

---

## 📱 1. UI / UX & Mobile-First Design

1. **Enfoque Mobile-First Obligatorio:**
   * Toda vista debe diseñarse, espaciarse y probarse primero en dimensiones de celular ($360\text{px} - 430\text{px}$) y luego expandirse a tablets y escritorio.
2. **Navegación Limpia y Sin Duplicaciones:**
   * **Mobile (PWA):** Barra fija inferior (`MobileBottomNav`) con acceso a las vistas principales y un **botón central flotante `+`** para la acción primaria. Se deben ocultar (`hidden sm:inline-flex`) los botones superiores duplicados para maximizar el espacio vertical útil.
   * **Desktop:** Header de ancho completo sin sidebar lateral molesta, con selector de Workspaces a la izquierda, pestañas de navegación al centro y controles de usuario/utilidades a la derecha.
3. **Tooltips Descriptivos al hacer Hover en Desktop:**
   * Todo botón, ícono o toggle de utilidad en el Header (Modo Privacidad, Switch de Moneda, Notificaciones) debe tener un tooltip flotante explicativo con estilo Shadcn (`bg-zinc-900 text-zinc-100 rounded-lg shadow-xl text-xs`).
4. **Selector de Tema Integrado en el Menú de Usuario:**
   * La opción de alternar entre Modo Claro y Oscuro se ubica dentro del desplegable del perfil del usuario (`UserNav`), liberando espacio horizontal en el Header tanto en mobile como en desktop.
5. **Feedback Táctil & "Spring Press":**
   * Todo botón, tarjeta clicable o switch debe incluir: `active:scale-95 duration-100 touch-manipulation cursor-pointer select-none`.
   * En CSS global: `-webkit-tap-highlight-color: transparent` para evitar el recuadro azul genérico en celulares.
5. **Micro-vibraciones Hápticas Suaves:**
   * Usar `triggerHaptic("light")` (6 a 8ms) o `triggerHaptic("selection")` al tocar el botón `+`, alternar pestañas, cambiar de mes o confirmar acciones en dispositivos compatibles.
6. **Gesto "Pull-to-Refresh" en Pantallas Dinámicas:**
   * En pantallas con datos de mercado o listas en vivo (como Inversiones), soportar el gesto de deslizar hacia abajo para refrescar datos vía `router.refresh()`.
7. **Transiciones Suaves:**
   * Evitar saltos visuales bruscos al cambiar de mes, moneda o filtros. Aplicar siempre `animate-in fade-in duration-300`.

---

## ⚡ 2. Rendimiento, Carga & Caching

1. **Skeleton Loaders en Carga Inicial:**
   * Cada ruta debe disponer de su archivo `loading.tsx` con componentes `<Skeleton />` animados que repliquen la estructura visual de la pantalla.
2. **Límite Inteligente de APIs Externas (PostgreSQL Caching):**
   * Para cotizaciones de mercado (Yahoo Finance / CoinGecko), consultar primero la tabla `asset_market_prices`. Si el registro tiene menos de 15 minutos (TTL = 15 min), responder desde la base de datos en ~1ms sin consumir cuotas de API.
   * Guardar snapshots diarios inmutables en `asset_price_history` para graficar evoluciones históricas con 0ms de latencia externa.
3. **Caché en Memoria en Cliente:**
   * En buscadores o comboboxes (`AssetSearchCombobox`), utilizar un `Map<string, T[]>` en memoria del navegador para entregar resultados de consultas repetidas en **0ms**.
4. **Paginación Progresiva por Scroll (IntersectionObserver):**
   * En historiales extensos (transacciones, compras/ventas), procesar el 100% de los datos en el servidor para calcular totales y gráficos exactos, pero renderizar en el cliente en bloques de 15 elementos a medida que el usuario hace scroll.
5. **Dynamic Import (Lazy Loading) de Módulos Pesados:**
   * Librerías pesadas de visualización como **Recharts** deben importarse con `next/dynamic` (`ssr: false`) y fallback de `<Skeleton />` para mantener el bundle inicial JS ultra-liviano.
6. **Instancias Singleton de Formateo:**
   * Centralizar los formateadores de números, monedas y porcentajes en `src/lib/formatters.ts` con caché de `Intl.NumberFormat` para evitar crear objetos en bucles de renderizado.

---

## 🔒 3. Seguridad, Privacidad & Multi-tenancy

1. **Aislamiento Estricto por Workspace:**
   * Toda tabla o entidad de negocio (`transactions`, `investment_transactions`, `categories`, `accounts`) DEBE incluir la columna `workspace_id`. Ninguna consulta puede cruzar datos entre workspaces sin validar membresía en `workspace_members`.
2. **Cifrado de Datos Financieros Sensibles (AES-256-CBC):**
   * Montos monetarios y cantidades (`amount`, `quantity`, `unitPrice`, `totalAmount`, `fees`) se cifran en el backend antes de insertarse en PostgreSQL mediante `src/lib/crypto.ts`. Las claves de cifrado nunca viajan al cliente.
3. **Modo Privacidad Global (👁️ / 👁️‍🗨️):**
   * Todo valor monetario renderizado en pantalla debe envolverse con el componente `<MaskedValue value="..." />` para soportar el enmascaramiento con `••••••` en lugares públicos con persistencia en `localStorage`.

---

## 💱 4. Finanzas, Multimoneda & Tipografía

1. **Soporte Multimoneda & Doble Lectura:**
   * Toda pantalla financiera debe permitir visualizar los datos en la moneda local del Workspace o en **Dólares (USD)**.
   * En KPIs y tarjetas principales, mostrar el valor principal en la moneda activa y el equivalente secundario aproximado en la otra moneda (`≈ $X USD` o `≈ $X ARS`).
2. **Alineación Numérica Estricta (`font-mono tabular-nums`):**
   * Todo monto, balance, precio, porcentaje y fecha en tablas o listas debe llevar la clase `font-mono tabular-nums` para asegurar que dígitos y comas queden exactamente alineados verticalmente.
3. **Contraste de Accesibilidad WCAG (Nivel AAA):**
   * En modo claro, los textos sobre fondos claros deben usar tonalidades contrastadas:
     * Verde (Positivo/Ingreso): `text-emerald-700 dark:text-emerald-400`
     * Rojo (Negativo/Gasto): `text-rose-700 dark:text-rose-400`
     * Ámbar (Cripto/Alerta): `text-amber-800 dark:text-amber-300`
     * Azul (Invertido/Acciones): `text-blue-800 dark:text-blue-300`
     * Púrpura (CEDEARs): `text-purple-800 dark:text-purple-300`
4. **Validación con Zod y Manejo de Errores:**
   * Formularios validados en cliente con `react-hook-form` + `zodResolver`.
   * Server Actions validadas con `safeParse` devolviendo siempre `{ success: boolean, data?: any, error?: string }`.
   * Notificaciones toast consistentes vía `sonner` (`toast.success` / `toast.error`).
