import type { BalanceHistoryPoint } from '@rumbo/shared';
import { useMemo } from 'react';

export type TimePeriod = 'TODAY' | 'WTD' | 'MTD' | 'YTD' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

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
    case 'TODAY': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'WTD': {
      const d = new Date(now);
      const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'MTD':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'YTD':
      return new Date(now.getFullYear(), 0, 1);
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

export function useNetWorthTimeline(
  history: BalanceHistoryPoint[],
  currentBalance: number,
  period: TimePeriod,
): NetWorthTimelineResult {
  return useMemo(() => {
    const periodStartDate = getStartDate(period);

    if (history.length === 0) {
      return {
        points: [],
        currentBalance,
        changeAmount: 0,
        changePercent: 0,
        isPositive: true,
        periodStartDate,
      };
    }

    // Convert API history to timestamped points (dates are full ISO datetimes)
    let allPoints: TimelinePoint[] = history.map((h) => ({
      date: new Date(h.date).getTime(),
      balance: Number.parseFloat(h.balance),
    }));

    // Add today as final point with current balance
    const now = new Date();
    const lastPoint = allPoints[allPoints.length - 1];
    if (!lastPoint || now.getTime() - lastPoint.date > 60_000) {
      allPoints.push({
        date: now.getTime(),
        balance: currentBalance,
      });
    }

    // For multi-day periods, collapse to end-of-day balances to avoid
    // misleading intra-day spikes (e.g. 500K → 100K on the same day).
    // Only "Hoy" shows individual transaction granularity.
    if (period !== 'TODAY') {
      const dayMap = new Map<string, TimelinePoint>();
      for (const point of allPoints) {
        const d = new Date(point.date);
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dayMap.set(dayKey, {
          date: new Date(`${dayKey}T12:00:00`).getTime(),
          balance: point.balance,
        });
      }
      allPoints = Array.from(dayMap.values()).sort((a, b) => a.date - b.date);
    }

    // Filter by period
    let filtered = allPoints;

    if (periodStartDate) {
      const startTs = periodStartDate.getTime();

      // Find the balance at the start of the period (last point before startDate)
      const beforeStart = allPoints.filter((p) => p.date < startTs);
      const balanceAtStart =
        beforeStart.length > 0 ? (beforeStart[beforeStart.length - 1]?.balance ?? 0) : 0;

      // Synthetic point at period boundary + points within range
      filtered = [
        { date: startTs, balance: balanceAtStart },
        ...allPoints.filter((p) => p.date >= startTs),
      ];
    }

    // Calculate change
    const startBalance = filtered[0]?.balance ?? 0;
    const changeAmount = currentBalance - startBalance;
    const changePercent = startBalance !== 0 ? (changeAmount / Math.abs(startBalance)) * 100 : 0;
    const isPositive = changeAmount >= 0;

    return {
      points: filtered,
      currentBalance,
      changeAmount,
      changePercent,
      isPositive,
      periodStartDate,
    };
  }, [history, currentBalance, period]);
}
