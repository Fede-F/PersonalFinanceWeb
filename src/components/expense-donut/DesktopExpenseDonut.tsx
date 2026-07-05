import React from 'react';

export interface CategorySegment {
  name: string;
  pct: number;
  amount: number;
  color: string;
}

interface ExpenseDonutProps {
  totalExpenses: number;
  segments: CategorySegment[];
}

/**
 * Desktop version of the expense donut chart.
 * Uses a larger viewBox (50×50) and radius 18 + strokeWidth 5
 * so the ring is visually bigger while leaving a spacious centre for text.
 */
export const DesktopExpenseDonut: React.FC<ExpenseDonutProps> = ({
  totalExpenses,
  segments,
}) => {
  // Using a 50×50 viewBox centred at 25,25 with radius 18
  // outer edge 25+18=43, inner edge 43-5=38 — well within the viewBox
  const cx = 25;
  const cy = 25;
  const radius = 18;
  const sw = 5;

  const circumference = 2 * Math.PI * radius;

  let accumulatedPct = 0;
  const segmentsWithOffsets = segments.map(seg => {
    const offset = circumference - (accumulatedPct * circumference) / 100;
    accumulatedPct += seg.pct;
    return {
      ...seg,
      offset,
      strokeDasharray: `${(seg.pct * circumference) / 100} ${circumference - (seg.pct * circumference) / 100}`
    };
  });

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
            {segmentsWithOffsets.map((seg, idx) => (
              seg.pct > 0 && (
                <circle
                  key={idx}
                  cx={cx} cy={cy} r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={sw}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.offset}
                  className="transition-all duration-500 ease-out"
                />
              )
            ))}
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
      <div className="flex-1 space-y-2 max-h-[140px] overflow-y-auto pr-1">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2" suppressHydrationWarning>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-zinc-600 dark:text-zinc-400 text-xs leading-tight truncate">{seg.name}</span>
              </div>
            </div>
            <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm tabular-nums shrink-0">{seg.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
