# Project Rules & Saved Context

## Saved Test Credentials
For local testing and validation:
- **Email:** `devtest@example.com`
- **Password:** `Password123!`
- **Default Workspace:** Test Workspace

## Completed Phases
- **Fase 1 (Gastos & Flujo de Fondos):** Completada (workspaces, gastos fijos/cuotas, multimoneda, Recharts, PWA).
- **Fase 2 (Portafolio de Inversiones en Vivo):** Completada (Cripto, USA & CEDEARs con Yahoo Finance/CoinGecko, buscador en vivo, cálculo bidireccional, sincronización de gastos, switch multimoneda `[ Base | USD ]`, modo privacidad, gráficos Recharts, micro-vibraciones hápticas y scroll infinito).

## Key Architecture & Conventions
1. **Multi-tenancy:** Toda entidad de negocio está aislada por `workspace_id`.
2. **Cifrado:** Valores monetarios sensibles se almacenan cifrados con AES-256-CBC vía `src/lib/crypto.ts`.
3. **Caching de Mercado:** Precios globales en `asset_market_prices` (TTL 15 min) y snapshots diarios inmutables en `asset_price_history`.
4. **Mobile First:** Componentes responsivos con barra inferior fija (`MobileBottomNav`) y feedback táctil (`triggerHaptic`).
