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
 * Mobile version of the expense donut chart.
 * Uses a compact layout optimised for small screens.
 * radius=14 + strokeWidth=4 keeps the ring well inside the 42×42 viewBox
 * while leaving a generous hollow centre for the text.
 */
export const MobileExpenseDonut: React.FC<ExpenseDonutProps> = ({
  totalExpenses,
  fixedPct,
  installmentPct,
  normalPct,
  fixedPctValue,
  installmentPctValue,
  normalPctValue,
}) => {
  // radius 14 → outer edge at 21+14=35, inner edge at 21+14-4=31
  // plenty of room inside the 42×42 viewBox
  const radius = 14;
  const sw = 4; // thinner stroke so the centre stays open
  const circumference = 2 * Math.PI * radius;
  const strokeDasharrayFixed = `${(fixedPct * circumference) / 100} ${circumference - (fixedPct * circumference) / 100}`;
  const strokeDasharrayInstallments = `${(installmentPct * circumference) / 100} ${circumference - (installmentPct * circumference) / 100}`;
  const strokeDasharrayNormal = `${(normalPct * circumference) / 100} ${circumference - (normalPct * circumference) / 100}`;
  const offsetNormal = circumference;
  const offsetInstallments = circumference - (normalPct * circumference) / 100;
  const offsetFixed = circumference - ((normalPct + installmentPct) * circumference) / 100;

  return (
    <div className="flex items-center gap-3 mt-2">
      {/* Donut chart — w-[72px] gives enough room without clipping */}
      <div className="relative w-[72px] h-[72px] shrink-0 flex items-center justify-center">
        {totalExpenses === 0 ? (
          <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
            <circle
              cx="21" cy="21" r={radius}
              fill="transparent" stroke="#e4e4e7" strokeWidth={sw}
              className="dark:stroke-zinc-800"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
            <circle
              cx="21" cy="21" r={radius}
              fill="transparent" stroke="#f4f4f5" strokeWidth={sw}
              className="dark:stroke-zinc-800/30"
            />
            {normalPct > 0 && (
              <circle cx="21" cy="21" r={radius}
                fill="transparent" stroke="#a1a1aa" strokeWidth={sw}
                strokeDasharray={strokeDasharrayNormal} strokeDashoffset={offsetNormal}
                className="transition-all duration-500 ease-out"
              />
            )}
            {installmentPct > 0 && (
              <circle cx="21" cy="21" r={radius}
                fill="transparent" stroke="#6366f1" strokeWidth={sw}
                strokeDasharray={strokeDasharrayInstallments} strokeDashoffset={offsetInstallments}
                className="transition-all duration-500 ease-out"
              />
            )}
            {fixedPct > 0 && (
              <circle cx="21" cy="21" r={radius}
                fill="transparent" stroke="#10b981" strokeWidth={sw}
                strokeDasharray={strokeDasharrayFixed} strokeDashoffset={offsetFixed}
                className="transition-all duration-500 ease-out"
              />
            )}
          </svg>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
          <span className="text-[7px] uppercase font-bold text-zinc-400 tracking-wider">Gastos</span>
          <span className="text-[9px] font-black text-zinc-800 dark:text-zinc-100 tabular-nums truncate max-w-full">
            {totalExpenses.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Legend — tighter gap between label and value */}
      <div className="flex-1 space-y-0.5">
        {/* Fijos */}
        <div className="flex items-center justify-between gap-0.5" suppressHydrationWarning>
          <div className="flex items-center gap-1 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-zinc-600 dark:text-zinc-400 text-[9px] leading-tight truncate">Gastos Fijos</span>
          </div>
          <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-[10px] tabular-nums shrink-0">{fixedPctValue}%</span>
        </div>
        {/* Cuotas */}
        <div className="flex items-center justify-between gap-0.5" suppressHydrationWarning>
          <div className="flex items-center gap-1 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span className="font-bold text-zinc-600 dark:text-zinc-400 text-[9px] leading-tight truncate">En Cuotas</span>
          </div>
          <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-[10px] tabular-nums shrink-0">{installmentPctValue}%</span>
        </div>
        {/* Comunes */}
        <div className="flex items-center justify-between gap-0.5" suppressHydrationWarning>
          <div className="flex items-center gap-1 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
            <span className="font-bold text-zinc-600 dark:text-zinc-400 text-[9px] leading-tight truncate">Gastos Comunes</span>
          </div>
          <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-[10px] tabular-nums shrink-0">{normalPctValue}%</span>
        </div>
      </div>
    </div>
  );
};
