import type { RemixiconComponentType } from '@remixicon/react';
import { RiExchangeLine, RiHomeLine, RiPieChartLine } from '@remixicon/react';

export type NavItem = {
  label: string;
  path: string;
  icon: RemixiconComponentType;
};

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: RiHomeLine },
  { label: 'Transactions', path: '/transactions', icon: RiExchangeLine },
  { label: 'Budgets', path: '/budgets', icon: RiPieChartLine },
];
