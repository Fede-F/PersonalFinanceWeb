import React from 'react';

interface ExpenseDonutProps {
  totalExpenses: number;
  fixedPct: number;
  installmentPct: number;
  normalPct: number;
  fixedPctValue: string;
  installmentPctValue: string;
  normalPctValue: string;
}

/**
 * Desktop version of the expense donut chart.
 * Uses a larger viewBox (50×50) and radius 18 + strokeWidth 5
 * so the ring is visually bigger while leaving a spacious centre for text.
 */
export const DesktopExpenseDonut: React.FC<ExpenseDonutProps> = ({
  totalExpenses,
  fixedPct,
  installmentPct,
  normalPct,
  fixedPctValue,
  installmentPctValue,
  normalPctValue,
}) => {
  // Using a 50×50 viewBox centred at 25,25 with radius 18
  // outer edge 25+18=43, inner edge 43-5=38 — well within the viewBox
  const cx = 25;
  const cy = 25;
  const radius = 18;
  const sw = 5;

  const strokeDasharrayFixed = `${fixedPct} ${100 - fixedPct}`;
  const strokeDasharrayInstallments = `${installmentPct} ${100 - installmentPct}`;
  const strokeDasharrayNormal = `${normalPct} ${100 - normalPct}`;
  const offsetFixed = 100 - fixedPct + 25;
  const offsetInstallments = 100 - fixedPct - installmentPct + 25;
  const offsetNormal = 100 - fixedPct - installmentPct - normalPct + 25;

  return (
    <div className="flex items-center gap-6 mt-2">
      {/* Donut chart — w-[140px] for a generous desktop size */}
      <div className="relative w-[140px] h-[140px] shrink-0 flex items-center justify-center">
        {totalExpenses === 0 ? (
          <svg viewBox="0 0 50 50" className="w-full h-full transform -rotate-90">
            <circle
              cx={cx} cy={cy} r={radius}
              fill="transparent" stroke="#e4e4e7" strokeWidth={sw}
              className="dark:stroke-zinc-800"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 50 50" className="w-full h-full transform -rotate-90">
            <circle
              cx={cx} cy={cy} r={radius}
              fill="transparent" stroke="#f4f4f5" strokeWidth={sw}
              className="dark:stroke-zinc-800/30"
            />
            {normalPct > 0 && (
              <circle cx={cx} cy={cy} r={radius}
                fill="transparent" stroke="#a1a1aa" strokeWidth={sw}
                strokeDasharray={strokeDasharrayNormal} strokeDashoffset={offsetNormal}
                className="transition-all duration-500 ease-out"
              />
            )}
            {installmentPct > 0 && (
              <circle cx={cx} cy={cy} r={radius}
                fill="transparent" stroke="#6366f1" strokeWidth={sw}
                strokeDasharray={strokeDasharrayInstallments} strokeDashoffset={offsetInstallments}
                className="transition-all duration-500 ease-out"
              />
            )}
            {fixedPct > 0 && (
              <circle cx={cx} cy={cy} r={radius}
                fill="transparent" stroke="#10b981" strokeWidth={sw}
                strokeDasharray={strokeDasharrayFixed} strokeDashoffset={offsetFixed}
                className="transition-all duration-500 ease-out"
              />
            )}
          </svg>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Gastos</span>
          <span className="text-sm font-black text-zinc-800 dark:text-zinc-100 tabular-nums truncate max-w-full">
            {totalExpenses.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {/* Fijos */}
        <div className="flex items-center justify-between gap-2" suppressHydrationWarning>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-zinc-600 dark:text-zinc-400 text-xs leading-tight truncate">Gastos Fijos</span>
              <span className="text-[10px] text-zinc-400 leading-none truncate">Alquiler, expensas, abonos...</span>
            </div>
          </div>
          <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm tabular-nums shrink-0">{fixedPctValue}%</span>
        </div>
        {/* Cuotas */}
        <div className="flex items-center justify-between gap-2" suppressHydrationWarning>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-zinc-600 dark:text-zinc-400 text-xs leading-tight truncate">En Cuotas</span>
              <span className="text-[10px] text-zinc-400 leading-none truncate">Tarjetas, pagos financiados</span>
            </div>
          </div>
          <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm tabular-nums shrink-0">{installmentPctValue}%</span>
        </div>
        {/* Comunes */}
        <div className="flex items-center justify-between gap-2" suppressHydrationWarning>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-zinc-600 dark:text-zinc-400 text-xs leading-tight truncate">Gastos Comunes</span>
              <span className="text-[10px] text-zinc-400 leading-none truncate">Almuerzos, ocio, salidas...</span>
            </div>
          </div>
          <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm tabular-nums shrink-0">{normalPctValue}%</span>
        </div>
      </div>
    </div>
  );
};
