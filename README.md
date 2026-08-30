# 💰 FinanceApp (Personal & Workspace Finance)

Plataforma moderna de **Gestión Financiera Multi-tenant** con seguimiento de **Gastos, Flujo de Fondos y Portafolio de Inversiones en Vivo**. Diseñada con arquitectura **Mobile-first (PWA)**, **Cifrado AES-256** y **Multimoneda**.

---

## 🌟 Características Principales

### 📊 1. Módulo de Gastos & Flujo de Fondos (Fase 1)
* **Workspaces Colaborativos:** Espacios aislados para hogares, proyectos o finanzas personales.
* **Tipos de Operaciones:** Gastos comunes, fijos periódicos y compras en cuotas (tarjetas).
* **Multimoneda Nativo:** Conversión y normalización automática en la moneda base del workspace.
* **Gráficos Recharts:** Donut interactivo de distribución de gastos y métrica de capacidad de ahorro.
* **Navegación Ágil:** Selector de período mensual con actualización optimista en 0ms.

### 📈 2. Módulo de Inversiones en Vivo (Fase 2)
* **Seguimiento Multi-mercado:** Criptomonedas (CoinGecko), Acciones de USA y CEDEARs (Yahoo Finance).
* **Buscador Inteligente (`AssetSearchCombobox`):** Búsqueda en vivo con autocompletado de precios y catálogo de activos frecuentes.
* **Cálculo Bidireccional:** Calcula automáticamente Total o Precio Unitario efectivo al ingresar montos y comisiones.
* **Sincronización con Gastos:** Opción de registrar la inversión y debitarla automáticamente del balance del workspace.
* **Historial Editable:** Modificación y eliminación con sincronización en tiempo real.
* **Gráficos Interactivos:**
  * **Evolución del Portafolio (`PortfolioChart`):** Área interactiva con gradientes (Valuación vs Capital Invertido).
  * **Distribución de Cartera (`AssetAllocationDonut`):** Desglose por categoría y activo.
* **Switch Multimoneda (`[ Moneda Base | USD ]`):** Alterna toda la pantalla de inversiones entre la moneda local y dólares con persistencia en `localStorage`.

### 📱 3. Experiencia Mobile & PWA
* **Instalable:** Manifiesto PWA (`manifest.webmanifest`) y Service Worker (`sw.js`) con soporte offline de assets.
* **Feedback Táctil:** Micro-vibraciones hápticas suaves (6-8ms) y compresión elástica (`active:scale-95`).
* **Barra Inferior con Botón Flotante `+`:** Acceso rápido con el pulgar para nuevas operaciones.
* **Modo Privacidad Global (👁️):** Enmascara saldos sensibles con `••••••` al usar la app en lugares públicos.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Shadcn/UI, Recharts, Lucide Icons |
| **Backend** | Server Actions, NextAuth v5, Node.js `crypto` (AES-256-CBC) |
| **Base de Datos** | PostgreSQL, Drizzle ORM |
| **APIs Externas** | Yahoo Finance API, CoinGecko API (con Caching de 15 min en Postgres) |

---

## 🚀 Inicio Rápido

### 1. Requisitos Previos
* Node.js 18+ instalado.
* Base de datos PostgreSQL activa.

### 2. Variables de Entorno (`.env.local`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/finance_app"
AUTH_SECRET="tu_secreto_nextauth"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="32_caracteres_hex_para_aes256"
```

### 3. Instalación y Ejecución
```bash
# Instalar dependencias
npm install

# Aplicar migraciones
npx drizzle-kit migrate

# Iniciar servidor de desarrollo
npm run dev
```

---

## 🔐 Credenciales de Prueba para Desarrollo Local
* **Email:** `devtest@example.com`
* **Contraseña:** `Password123!`
* **Workspace por Defecto:** Test Workspace
