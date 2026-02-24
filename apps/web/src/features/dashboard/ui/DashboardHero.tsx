import { RiArrowDownSFill, RiArrowUpSFill } from '@remixicon/react';
import type { BalanceHistoryPoint, Currency } from '@rumbo/shared';
import { useState } from 'react';
import { formatBalance } from '@/features/financial-products/model/constants';
import { NetWorthChart } from './NetWorthChart';
import type { TimePeriod } from './useNetWorthTimeline';
import { useNetWorthTimeline } from './useNetWorthTimeline';

type DashboardHeroProps = {
  userName: string;
  totalBalance: number;
  balanceHistory: BalanceHistoryPoint[];
  activeCurrency: Currency;
  currencies: Currency[];
  onCurrencyChange: (currency: Currency) => void;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

const PERIOD_LABELS: Record<TimePeriod, string> = {
  WTD: 'esta semana',
  MTD: 'este mes',
  YTD: 'este año',
  '1W': 'última semana',
  '1M': 'último mes',
  '3M': 'últimos 3 meses',
  '6M': 'últimos 6 meses',
  '1Y': 'último año',
  ALL: 'en total',
};

export function DashboardHero({
  userName,
  totalBalance,
  balanceHistory,
  activeCurrency,
  currencies,
  onCurrencyChange,
}: DashboardHeroProps) {
  const [period, setPeriod] = useState<TimePeriod>('1M');
  const { points, currentBalance, changeAmount, changePercent, isPositive, periodStartDate } =
    useNetWorthTimeline(balanceHistory, totalBalance, period);

  const firstName = userName.split(' ')[0] || userName;
  const formattedBalance = formatBalance(String(currentBalance), activeCurrency);
  const formattedChange = formatBalance(String(Math.abs(changeAmount)), activeCurrency);
  const isNegativeBalance = currentBalance < 0;

  return (
    <div className="flex flex-col gap-6 py-4 md:flex-row md:items-stretch md:gap-8 md:py-6">
      {/* Left column — greeting, balance & stats */}
      <div className="flex flex-col gap-6 md:w-1/3">
        {/* Greeting */}
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
          {getGreeting()}, {firstName}
        </h1>

        <div>
          <p className="text-sm text-muted-foreground">Balance total</p>
          <p
            className={`mt-1 text-5xl font-bold tabular-nums tracking-tight md:text-6xl ${
              isNegativeBalance ? 'text-destructive' : ''
            }`}
          >
            {formattedBalance}
          </p>

          {/* Change indicator */}
          {changeAmount !== 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isPositive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                {isPositive ? (
                  <RiArrowUpSFill className="h-3.5 w-3.5" />
                ) : (
                  <RiArrowDownSFill className="h-3.5 w-3.5" />
                )}
                {Math.abs(changePercent).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {isPositive ? '+' : '-'}
                {formattedChange} {PERIOD_LABELS[period]}
              </span>
            </div>
          )}
        </div>

        {/* Currency toggle */}
        {currencies.length > 1 && (
          <div className="flex items-center gap-1">
            {currencies.map((currency) => (
              <button
                key={currency}
                type="button"
                onClick={() => onCurrencyChange(currency)}
                className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  currency === activeCurrency
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right column — chart (stretches to full height) */}
      <div className="min-w-0 flex-1">
        <NetWorthChart
          points={points}
          currency={activeCurrency}
          period={period}
          onPeriodChange={setPeriod}
          isPositive={isPositive}
          periodStartDate={periodStartDate}
        />
      </div>
    </div>
  );
}
