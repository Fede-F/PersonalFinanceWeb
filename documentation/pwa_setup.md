# Configuración PWA (Progressive Web App) e Instalación Móvil

Este documento detalla la arquitectura y el comportamiento del soporte PWA implementado para permitir la instalación de FinanceApp en Android, iOS y Escritorio.

## Componentes de la PWA

### 1. Manifiesto Web (`src/app/manifest.ts`)
Utiliza la API nativa de metadatos de Next.js para generar el archivo `/manifest.webmanifest`.
- **Ruta de inicio:** Redirige automáticamente a `/dashboard` al abrir la app instalada.
- **Modo de visualización:** `standalone` (ejecuta la aplicación sin la barra de direcciones del navegador).
- **Esquema de colores:** Fondo y color de tema configurados en `#09090b` (zinc oscuro) para una integración visual fluida en modo oscuro.

### 2. Service Worker (`public/sw.js`)
El Service Worker se aloja en la raíz del directorio público para controlar todo el alcance (`scope`) de la aplicación.
- **Estrategia de Caché:** Carga los archivos esenciales de la interfaz (App Shell) de manera local.
- **Filtros de Exclusión:** No interfiere en llamadas a endpoints `/api/*` ni en rutas internas de Next.js/Webpack de desarrollo (`/_next/*`).
- **Resiliencia:** En caso de fallas de red, intenta servir el recurso solicitado desde el caché local.

### 3. Registro del Service Worker (`src/components/pwa-register.tsx`)
Un componente del lado del cliente (`"use client"`) que registra el Service Worker en segundo plano únicamente si el navegador soporta Service Workers. Se incluye de forma global en `src/app/layout.tsx`.

---

## Comportamiento Offline (Sin Conexión)

Cuando el dispositivo pierde la conexión a internet:
1. **Carga de la Interfaz:** La aplicación se abre y carga la estructura visual (App Shell) de manera instantánea recuperando los archivos desde el caché local.
2. **Consultas y Mutaciones:** Dado que los datos financieros se almacenan en la base de datos remota de PostgreSQL, las operaciones dinámicas (creación, edición y eliminación de gastos) fallarán. La aplicación mostrará notificaciones sonner indicando problemas de conexión a internet.

---

## Proceso de Instalación

### En Android (Chrome/Edge):
1. Abrir el navegador en el dispositivo móvil y acceder a la URL del proyecto.
2. Aparecerá automáticamente un aviso o banner flotante sugiriendo **"Añadir a la pantalla de inicio"** o **"Instalar aplicación"**.
3. También se puede instalar desde el menú de opciones del navegador seleccionando **"Instalar aplicación"**.

### En Escritorio (Chrome/Edge/Safari):
1. Acceder a la URL de la aplicación web.
2. Hacer clic en el icono de instalación (pantalla con una flecha) ubicado en la parte derecha de la barra de direcciones.
