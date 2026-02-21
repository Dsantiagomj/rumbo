import {
  RiArrowDownLine,
  RiArrowDownSFill,
  RiArrowRightLine,
  RiArrowUpLine,
  RiArrowUpSFill,
  RiBriefcaseLine,
} from '@remixicon/react';
import type { Currency, ProductResponse, ProductType } from '@rumbo/shared';
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { formatBalance } from '@/features/financial-products/model/constants';
import { NetWorthChart } from './NetWorthChart';
import type { TimePeriod } from './useNetWorthTimeline';
import { useNetWorthTimeline } from './useNetWorthTimeline';

type DashboardHeroProps = {
  userName: string;
  products: ProductResponse[];
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

const LIABILITY_TYPES: ProductType[] = ['credit_card', 'loan_free_investment', 'loan_mortgage'];

export function DashboardHero({
  userName,
  products,
  activeCurrency,
  currencies,
  onCurrencyChange,
}: DashboardHeroProps) {
  const [period, setPeriod] = useState<TimePeriod>('1M');
  const { points, currentBalance, changeAmount, changePercent, isPositive, periodStartDate } =
    useNetWorthTimeline(products, activeCurrency, period);

  const firstName = userName.split(' ')[0] || userName;
  const formattedBalance = formatBalance(String(currentBalance), activeCurrency);
  const formattedChange = formatBalance(String(Math.abs(changeAmount)), activeCurrency);
  const isNegativeBalance = currentBalance < 0;

  const productSummary = useMemo(() => {
    const total = products.length;
    const liabilities = products.filter((p) => LIABILITY_TYPES.includes(p.type)).length;
    const assets = total - liabilities;
    return { total, assets, liabilities };
  }, [products]);

  return (
    <div className="space-y-2">
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">Esto es lo que ha pasado con tus finanzas</p>
      </div>

      {/* Balance + chart — two columns on desktop */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        {/* Left column — balance & stats */}
        <div className="flex flex-col gap-4 md:w-2/5">
          <div>
            <p className="text-sm text-muted-foreground">Balance total</p>
            <p
              className={`mt-1 text-3xl font-bold tabular-nums tracking-tight ${
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

          {/* Product summary */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-border/50 bg-muted/30 p-2">
              <div className="flex flex-col items-center gap-0.5 text-center">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <RiBriefcaseLine className="size-3.5" />
                  <span className="text-[10px] uppercase tracking-wide">Total</span>
                </div>
                <span className="text-base font-semibold text-foreground">
                  {productSummary.total}
                </span>
              </div>

              <div className="flex flex-col items-center gap-0.5 border-x border-border/50 text-center">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
                  <RiArrowUpLine className="size-3.5" />
                  <span className="text-[10px] uppercase tracking-wide">Activos</span>
                </div>
                <span className="text-base font-semibold text-foreground">
                  {productSummary.assets}
                </span>
              </div>

              <div className="flex flex-col items-center gap-0.5 text-center">
                <div className="flex items-center gap-1 text-red-600 dark:text-red-500">
                  <RiArrowDownLine className="size-3.5" />
                  <span className="text-[10px] uppercase tracking-wide">Pasivos</span>
                </div>
                <span className="text-base font-semibold text-foreground">
                  {productSummary.liabilities}
                </span>
              </div>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Gestionar productos
              <RiArrowRightLine className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Right column — chart */}
        <div className="flex-1 min-w-0">
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
    </div>
  );
}
