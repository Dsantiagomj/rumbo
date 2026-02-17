import { describe, expect, it } from 'vitest';
import { APP_NAME, DEFAULT_CURRENCY, DEFAULT_LOCALE } from '../index.js';

describe('shared constants', () => {
  it('exports APP_NAME', () => {
    expect(APP_NAME).toBe('Rumbo');
  });

  it('exports DEFAULT_LOCALE as es-CO', () => {
    expect(DEFAULT_LOCALE).toBe('es-CO');
  });

  it('exports DEFAULT_CURRENCY as COP', () => {
    expect(DEFAULT_CURRENCY).toBe('COP');
  });
});
