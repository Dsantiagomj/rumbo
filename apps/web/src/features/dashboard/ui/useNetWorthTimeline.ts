import type { Currency, ProductResponse } from '@rumbo/shared';
import { useMemo } from 'react';

export type TimePeriod = 'WTD' | 'MTD' | 'YTD' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export type TimelinePoint = {
  date: number;
  balance: number;
};

export type NetWorthTimelineResult = {
  points: TimelinePoint[];
  currentBalance: number;
  changeAmount: number;
  changePercent: number;
  isPositive: boolean;
  periodStartDate: Date | null;
};

function getStartDate(period: TimePeriod): Date | null {
  const now = new Date();

  switch (period) {
    case 'WTD': {
      const d = new Date(now);
      const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'MTD': {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    case 'YTD': {
      return new Date(now.getFullYear(), 0, 1);
    }
    case '1W': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '1M': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '3M': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '6M': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '1Y': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'ALL':
      return null;
  }
}

function getProductBalance(product: ProductResponse, currency: Currency): number | null {
  if (product.currency === currency) {
    return Number.parseFloat(product.balance);
  }

  if (currency === 'USD') {
    const meta = product.metadata as Record<string, unknown> | null;
    if (meta?.balanceUsd && typeof meta.balanceUsd === 'string') {
      return Number.parseFloat(meta.balanceUsd);
    }
  }

  return null;
}

export function useNetWorthTimeline(
  products: ProductResponse[],
  currency: Currency,
  period: TimePeriod,
): NetWorthTimelineResult {
  return useMemo(() => {
    const productBalances = products
      .map((p) => ({ product: p, balance: getProductBalance(p, currency) }))
      .filter(
        (entry): entry is { product: ProductResponse; balance: number } => entry.balance !== null,
      );

    const periodStartDate = getStartDate(period);

    if (productBalances.length === 0) {
      return {
        points: [],
        currentBalance: 0,
        changeAmount: 0,
        changePercent: 0,
        isPositive: true,
        periodStartDate,
      };
    }

    // Sort by creation date ascending
    const sorted = [...productBalances].sort(
      (a, b) => new Date(a.product.createdAt).getTime() - new Date(b.product.createdAt).getTime(),
    );

    // Build cumulative timeline: each product creation adds its balance
    const events: { date: Date; cumulativeBalance: number }[] = [];
    let cumulative = 0;

    for (const { product, balance } of sorted) {
      cumulative += balance;
      events.push({
        date: new Date(product.createdAt),
        cumulativeBalance: cumulative,
      });
    }

    const now = new Date();
    const currentBalance = cumulative;

    // Add "today" as final point if last event isn't today
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent.date.toDateString() !== now.toDateString()) {
      events.push({ date: now, cumulativeBalance: currentBalance });
    }

    // Filter by period
    let filtered = events;

    if (periodStartDate) {
      // Find the balance at the start of the period (last event before startDate)
      const beforeStart = events.filter((e) => e.date < periodStartDate);
      const lastBeforeStart = beforeStart[beforeStart.length - 1];
      const balanceAtStart = lastBeforeStart ? lastBeforeStart.cumulativeBalance : 0;

      // Include a synthetic point at the start boundary
      filtered = [
        { date: periodStartDate, cumulativeBalance: balanceAtStart },
        ...events.filter((e) => e.date >= periodStartDate),
      ];
    }

    const points: TimelinePoint[] = filtered.map((e) => ({
      date: e.date.getTime(),
      balance: e.cumulativeBalance,
    }));

    // Calculate change
    const startBalance = points[0]?.balance ?? 0;
    const changeAmount = currentBalance - startBalance;
    const changePercent = startBalance !== 0 ? (changeAmount / Math.abs(startBalance)) * 100 : 0;
    const isPositive = changeAmount >= 0;

    return { points, currentBalance, changeAmount, changePercent, isPositive, periodStartDate };
  }, [products, currency, period]);
}
