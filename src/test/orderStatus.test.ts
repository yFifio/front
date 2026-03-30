import { describe, expect, it } from 'vitest';
import {
  ALL_ORDER_STATUS_OPTIONS,
  DELIVERY_ORDER_STATUS_OPTIONS,
  NON_SHIPPING_ORDER_STATUS_OPTIONS,
  getOrderStatusClassName,
  getOrderStatusLabel,
  normalizeOrderStatus,
} from '@/lib/orderStatus';

describe('orderStatus utilities', () => {
  it('normalizes invalid and empty statuses to pending', () => {
    expect(normalizeOrderStatus(undefined)).toBe('pending');
    expect(normalizeOrderStatus(null)).toBe('pending');
    expect(normalizeOrderStatus('unknown')).toBe('pending');
  });

  it('keeps valid status unchanged', () => {
    expect(normalizeOrderStatus('paid')).toBe('paid');
    expect(normalizeOrderStatus('shipped')).toBe('shipped');
  });

  it('returns expected label for known statuses and fallback for unknown', () => {
    expect(getOrderStatusLabel('pending')).toBe('Aguardando pagamento');
    expect(getOrderStatusLabel('paid')).toBe('Pago');
    expect(getOrderStatusLabel('invalid')).toBe('Aguardando pagamento');
  });

  it('returns expected badge classname for known statuses and fallback for unknown', () => {
    expect(getOrderStatusClassName('delivered')).toContain('bg-blue-100');
    expect(getOrderStatusClassName('cancelled')).toContain('bg-red-100');
    expect(getOrderStatusClassName('invalid')).toContain('bg-yellow-100');
  });

  it('exports expected status options for each context', () => {
    expect(ALL_ORDER_STATUS_OPTIONS.map((option) => option.value)).toEqual([
      'pending',
      'paid',
      'shipped',
      'delivered',
      'cancelled',
    ]);

    expect(NON_SHIPPING_ORDER_STATUS_OPTIONS.map((option) => option.value)).toEqual([
      'pending',
      'paid',
      'delivered',
      'cancelled',
    ]);

    expect(DELIVERY_ORDER_STATUS_OPTIONS.map((option) => option.value)).toEqual([
      'paid',
      'shipped',
      'delivered',
    ]);
  });
});
