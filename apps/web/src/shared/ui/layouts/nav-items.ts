import type { RemixiconComponentType } from '@remixicon/react';
import { RiExchangeLine, RiHomeLine, RiWalletLine } from '@remixicon/react';

export type NavItem = {
  label: string;
  path: string;
  icon: RemixiconComponentType;
};

export const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: RiHomeLine },
  { label: 'Transactions', path: '/transactions', icon: RiExchangeLine },
  { label: 'Products', path: '/products', icon: RiWalletLine },
];
