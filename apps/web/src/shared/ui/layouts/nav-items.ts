import {
  RiDashboardLine,
  RiExchangeLine,
  RiHomeLine,
  RiSettingsLine,
  RiWalletLine,
} from '@remixicon/react';
import type { ComponentType } from 'react';

export type NavItem = {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string; size?: number }>;
};

export const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: RiHomeLine },
  { label: 'Dashboard', path: '/dashboard', icon: RiDashboardLine },
  { label: 'Transactions', path: '/transactions', icon: RiExchangeLine },
  { label: 'Products', path: '/products', icon: RiWalletLine },
  { label: 'Settings', path: '/settings', icon: RiSettingsLine },
];
