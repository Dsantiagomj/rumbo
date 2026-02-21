import type { Currency } from '@rumbo/shared';
import { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatBalance } from '@/features/financial-products/model/constants';
import type { TimelinePoint, TimePeriod } from './useNetWorthTimeline';

type NetWorthChartProps = {
  points: TimelinePoint[];
  currency: Currency;
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  isPositive: boolean;
  periodStartDate: Date | null;
};

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'WTD', label: 'Sem' },
  { value: 'MTD', label: 'Mes' },
  { value: 'YTD', label: 'Año' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1A' },
  { value: 'ALL', label: 'Todo' },
];

function formatDateLabel(timestamp: number, period: TimePeriod): string {
  const date = new Date(timestamp);
  if (period === 'WTD' || period === '1W') {
    return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
  }
  if (period === 'MTD' || period === '1M' || period === '3M') {
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }
  return date.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
}

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { value: number }[];
  currency: Currency;
}) {
  if (!active || !payload?.[0]) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-sm font-semibold tabular-nums">
        {formatBalance(String(payload[0].value), currency)}
      </p>
    </div>
  );
}

function formatDateRange(startDate: Date | null): string | null {
  if (!startDate) return null;
  const now = new Date();
  const start = startDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  const end = now.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${start} — ${end}`;
}

export function NetWorthChart({
  points,
  currency,
  period,
  onPeriodChange,
  isPositive,
  periodStartDate,
}: NetWorthChartProps) {
  const strokeColor = isPositive
    ? 'var(--chart-positive, #22c55e)'
    : 'var(--chart-negative, #ef4444)';
  const fillId = 'netWorthGradient';

  const domain = useMemo(() => {
    if (points.length === 0) return [0, 0];
    const balances = points.map((p) => p.balance);
    const min = Math.min(...balances);
    const max = Math.max(...balances);
    const padding = (max - min) * 0.1 || 1;
    return [min - padding, max + padding];
  }, [points]);

  return (
    <div className="flex flex-col gap-3">
      <div className="h-[180px] w-full">
        {points.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(v) => formatDateLabel(v, period)}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                tickCount={4}
              />
              <YAxis domain={domain} hide />
              <Tooltip
                content={<CustomTooltip currency={currency} />}
                cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${fillId})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: 'var(--background)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No hay suficientes datos para graficar</p>
          </div>
        )}
      </div>

      {/* Date range + time period selectors */}
      <div className="flex items-center gap-2">
        {formatDateRange(periodStartDate) && (
          <span className="text-xs text-muted-foreground/60">
            {formatDateRange(periodStartDate)}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onPeriodChange(p.value)}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === p.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
