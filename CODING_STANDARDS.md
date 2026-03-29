# FinanceWebApp: Estándares de Desarrollo

Este documento define las reglas de oro para mantener la consistencia y profesionalismo en el código de la aplicación.

## 1. Arquitectura & Componentes
- **Next.js App Router:** Usar **Server Components** para la carga inicial de datos y **Client Components** solo cuando hay interactividad (hooks).
- **Consistencia Visual:** Usar Shadcn/UI como base. Las modificaciones de estilo deben hacerse mediante utilidades de Tailwind (manteniendo el diseño premium: bordes suaves, sombras sutiles y espaciado generoso).
- **Naming:**
  - Componentes: `PascalCase` (ej: `TransactionModal.tsx`)
  - Funciones/Variables: `camelCase` (ej: `createTransaction`)
  - DB Schema (Drizzle): `snake_case` para nombres de tabla en SQL (ej: `market_rates`) y `camelCase` para nombres de campo en TS.

## 2. Gestión de Datos y Formularios
- **Validación:** Todas las entradas deben validarse con **Zod** (esquemas centralizados en `src/lib/validations.ts`).
- **Formularios:** Usar `react-hook-form` con el `zodResolver`.
- **Server Actions:** Las mutaciones deben realizarse siempre mediante Server Actions en `src/app/actions/`. Deben devolver un objeto `{ success: boolean, data?: any, error?: string }`.

## 3. Manejo de Monedas y Normalización
- **Regla de Oro:** Siempre almacenar el monto original, la moneda original y el `exchangeRate` con respecto a la moneda base del Workspace.
- **Normalización:** Los cálculos globales en el Dashboard deben usar siempre `monto * exchangeRate` para mostrar un valor unificado.

## 4. Feedback de Usuario
- **Sonner:** Usar `toast.success()` y `toast.error()` para informar al usuario sobre el resultado de sus acciones.
- **Loading:** Deshabilitar botones de submit y mostrar estados de carga ("Registrando...") para evitar doble click accidental.

## 5. Documentación de Decisiones
- Cualquier cambio estructural en la base de datos o en el flujo de usuario debe reflejarse en `PROJECT_CONTEXT.md`.
