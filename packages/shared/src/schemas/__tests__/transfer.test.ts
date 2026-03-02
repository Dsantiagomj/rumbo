import { describe, expect, it } from 'vitest';
import { createTransferSchema } from '../transfer.js';

describe('createTransferSchema', () => {
  const validInput = {
    sourceProductId: '11111111-1111-4111-a111-111111111111',
    destinationProductId: '22222222-2222-4222-a222-222222222222',
    amount: '500000.00',
    currency: 'COP',
    date: '2026-03-01',
  };

  it('validates valid same-currency transfer request', () => {
    const result = createTransferSchema.safeParse(validInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceProductId).toBe(validInput.sourceProductId);
      expect(result.data.destinationProductId).toBe(validInput.destinationProductId);
      expect(result.data.amount).toBe('500000.00');
      expect(result.data.currency).toBe('COP');
    }
  });

  it('rejects when source equals destination', () => {
    const result = createTransferSchema.safeParse({
      ...validInput,
      destinationProductId: validInput.sourceProductId,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Source and destination must be different');
    }
  });

  it('rejects invalid amount format', () => {
    const result = createTransferSchema.safeParse({
      ...validInput,
      amount: 'abc',
    });

    expect(result.success).toBe(false);
  });

  it('rejects amount with more than 2 decimal places', () => {
    const result = createTransferSchema.safeParse({
      ...validInput,
      amount: '100.123',
    });

    expect(result.success).toBe(false);
  });

  it('accepts optional exchangeRate', () => {
    const result = createTransferSchema.safeParse({
      ...validInput,
      exchangeRate: '4100.50',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exchangeRate).toBe('4100.50');
    }
  });

  it('rejects invalid exchangeRate format', () => {
    const result = createTransferSchema.safeParse({
      ...validInput,
      exchangeRate: 'abc',
    });

    expect(result.success).toBe(false);
  });

  it('accepts optional notes', () => {
    const result = createTransferSchema.safeParse({
      ...validInput,
      notes: 'Monthly rent transfer',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('Monthly rent transfer');
    }
  });

  it('accepts null notes', () => {
    const result = createTransferSchema.safeParse({
      ...validInput,
      notes: null,
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID for sourceProductId', () => {
    const result = createTransferSchema.safeParse({
      ...validInput,
      sourceProductId: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid currency', () => {
    const result = createTransferSchema.safeParse({
      ...validInput,
      currency: 'EUR',
    });

    expect(result.success).toBe(false);
  });

  it('accepts USD currency', () => {
    const result = createTransferSchema.safeParse({
      ...validInput,
      currency: 'USD',
    });

    expect(result.success).toBe(true);
  });
});
