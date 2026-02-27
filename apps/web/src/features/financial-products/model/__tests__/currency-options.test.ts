import { describe, expect, it } from 'vitest';
import { getAvailableCurrencies } from '../currency-options';

describe('getAvailableCurrencies', () => {
  it('returns COP and USD for cash products', () => {
    expect(getAvailableCurrencies('cash', 'COP', null)).toEqual(['COP', 'USD']);
    expect(getAvailableCurrencies('cash', 'USD', null)).toEqual(['COP', 'USD']);
  });

  it('returns COP and USD for dual-currency credit card networks', () => {
    const metadata = { network: 'mastercard' };

    expect(getAvailableCurrencies('credit_card', 'COP', metadata)).toEqual(['COP', 'USD']);
  });

  it('returns only product currency for single-currency credit card networks', () => {
    const metadata = { network: 'visa' };

    expect(getAvailableCurrencies('credit_card', 'COP', metadata)).toEqual(['COP']);
  });

  it('returns only product currency when metadata is missing', () => {
    expect(getAvailableCurrencies('credit_card', 'USD', null)).toEqual(['USD']);
  });

  it('returns only product currency for non-cash and non-credit-card products', () => {
    expect(getAvailableCurrencies('savings', 'COP', null)).toEqual(['COP']);
  });
});
