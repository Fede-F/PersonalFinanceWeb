# FinanceWebApp: Plan de Evolución Dashboard

Este documento detalla las fases para transformar el dashboard de una lista de gastos a un sistema completo de inteligencia financiera.

## Fase 1: Enfoque y Cierre Mensual
- **Objetivo:** Evitar la "sumatoria infinita" de transacciones.
- **Acciones:**
  - Añadir selector de Período (Mes/Año) en la parte superior del Dashboard.
  - El Dashboard cargará por defecto los datos del mes en curso.
  - Implementar consulta SQL dinámica basada en el período seleccionado.

## Fase 2: Comparativa de Rendimiento
- **Objetivo:** Dar perspectiva histórica al usuario.
- **Acciones:**
  - Añadir "Mini-Dashboard" comparativo.
  - Mostrar la variación porcentual con respecto al mes anterior.
  - Ejemplo: `Gastos del mes: $100.000 (-15% vs mes pasado)` en color verde si bajó el gasto.

## Fase 3: Detalle de Actividad Multi-Moneda
- **Objetivo:** Eliminar la "incertidumbre" de los gastos bimonetarios.
- **Acciones:**
  - En la lista de actividad reciente, mostrar siempre la referencia en la moneda base.
  - `Apple Music: 10,99 USD` -> `≈ 11.000 ARS (Ref)`.

## Fase 4: Flujo de Caja (Cash Flow) y Gastos Fijos
- **Objetivo:** Diferenciar el consumo diario de las obligaciones estructurales.
- **Acciones:**
  - Crear una **Nueva Página ("Flujo de Caja")**.
  - **Gastos Fijos:** Sección para cargar servicios mensualmente (Luz, Gas, Internet, Expensas).
  - **Ingresos Pasivos:** Registro de rentas o dividendos recurrentes.
  - Integrar estas previsiones en el Dashboard como "Gastos por pagar" del mes.

## Fase 5: Módulo de Activos e Inversiones
- **Objetivo:** Visión global del patrimonio.
- **Acciones:**
  - Implementar seguimiento de Cedears, Cripto o Plazo Fijo.
  - Valuación en tiempo real basándose en el módulo de `market_rates`.
  - Gráfico de torta con la distribución del patrimonio por tipo de activo.
