# Project Context: Finance Web App (SaaS Ready)

## 1. Project Vision
Una aplicación web de finanzas personales escalable y colaborativa.
- **Core Value:** Gestión financiera multi-tenant basada en "Workspaces" (Hogares/Grupos).
- **Enfoque:** API-first, Mobile-first (PWA), diseñada para automatización (n8n ready).
- **Roadmap:**
    1. Phase 1: Gestión de Gastos, Workspaces y Colaboración (FOCUS ACTUAL).
        - *Nota:* El flujo de cuentas financieras (`accounts`) está preparado en BD pero deshabilitado en UI para simplificar la Phase 1.
    2. Phase 2: Gestión activa de Cuentas, Bancos, Inversiones y Portafolio.
    3. Phase 3: Roadmap financiero y Metas.

## 2. Tech Stack (Strict)
- **Framework:** Next.js 14+ (App Router).
- **Language:** TypeScript (Strict Mode).
- **Styling:** Tailwind CSS + Shadcn/UI.
- **Database:** PostgreSQL.
- **ORM:** Drizzle ORM (con Migrations).
- **Auth:** NextAuth.js v5 (Auth.js).
- **State Management:** React Server Components (Server State) + Zustand (Client State si es necesario).

## 4. Documentación Secundaria
- [🛠️ Estándares de Desarrollo](CODING_STANDARDS.md): Reglas de arquitectura, naming y lógica.
- [🚀 Plan de Evolución Dashboard](documentation/dashboard_evolution_plan.md): Próximos pasos (Contexto mensual, Flujo de caja, Inversiones).

## 5. Architecture & Patterns
- **Database-per-Schema:** NO. Usamos base de datos compartida.
- **Tenancy Model:** "Workspace-based Tenancy".
    - El `Workspace` es la unidad de aislamiento de datos y facturación.
    - No existe una entidad "Organization" o "Tenant" superior.
    - Un usuario (Global Identity) puede pertenecer a N Workspaces mediante `workspace_members`.
- **Data Isolation:**
    - Todas las tablas de negocio (`transactions`, `accounts`, `investments`) DEBEN tener `workspace_id`.
    - **RLS Rule:** `auth.uid()` debe existir en `workspace_members` para el `workspace_id` de la fila que se intenta leer/escribir.
- **User Identity:**
    - Los usuarios son globales (`public.users`). No se duplican por workspace.
    - Soporte híbrido: OAuth (Google/GitHub) y Credenciales (Email/Password).
    - Unificación automática: Cuentas sociales y de credenciales se vinculan mediante el email.
    - El perfil del usuario (nombre, avatar) es único y compartido entre sus workspaces.
- **Security:** Row Level Security (RLS) en Postgres es la defensa final.
- **Money Handling:**
    - Nunca usar `float` para dinero. Usar `decimal`/`numeric` en DB.
    - **UX:** Uso de `MoneyInput` con separadores de miles y coma decimal en tiempo real.
    - Multimoneda: Guardar monto original + moneda original + tasa de cambio histórica.
    - Sincronización: La moneda por defecto del usuario se sincroniza con la `base_currency` de su workspace activo.
    - Cotizaciones de Mercado: Tabla global `market_rates` (sin `workspace_id`).
- **Validation Standard:**
    - Uso de `React Hook Form` + `Zod` para validación en cliente con marcado visual de campos inválidos (bordes rojos y mensajes localizados).
    - Server Actions deben usar `safeParse` de Zod para evitar excepciones fatales.

## 4. Database Schema (Drizzle/SQL Definition Reference)

### Global / System Tables
- `users`: id (UUID), email, full_name, password (hashed, optional for OAuth users).
- `accounts`: id (provider + id), user_id, type, provider, access_token, etc. (NextAuth tables).
- `market_rates`: id, base_currency, target_currency, rate, date (Unique constraint on currency pair + date).
- `supported_currencies`: code (ISO), name, type.

### Tenant Tables (Must have `workspace_id`)
- `workspaces`: id, name, owner_id, base_currency.
- `workspace_members`: workspace_id, user_id, role (OWNER, EDITOR, VIEWER), permissions (JSONB).
- `accounts`: id, workspace_id, name, type (CASH, BANK), currency, balance.
- `categories`: id, workspace_id, name, icon, color.
- `transactions`:
    - id, workspace_id, account_id (OPTIONAL - Phase 1), category_id (OPTIONAL).
    - type (INCOME, EXPENSE, TRANSFER).
    - amount (original currency), currency.
    - exchange_rate (snapshot at transaction time).
    - date, description (UI: "Detalle / Notas").

## 5. Coding Guidelines for AI
1. **Critical Thinking:** No asumas. Si un requerimiento es ambiguo, pregunta o implementa la solución más robusta/escalable.
2. **Type Safety:** No uses `any`. Define interfaces para todo.
3. **Component Modularity:** Componentes pequeños y reutilizables. Usa la estructura de carpetas de Next.js App Router correctamente.
4. **Migrations:** Todo cambio en la BD debe hacerse vía migración de Drizzle (`drizzle-kit generate` + `migrate`).