import { formatCents, parseCents } from './money';

describe('money', () => {
  it('formats cents without floating point', () => {
    expect(formatCents(123450)).toBe('$ 1.234,50');
    expect(formatCents(0)).toBe('$ 0,00');
    expect(formatCents(-500)).toBe('-$ 5,00');
  });

  it('parses Argentine amounts to integer cents', () => {
    expect(parseCents('1.234,50')).toBe(123450);
    expect(parseCents('1234,5')).toBe(123450);
    expect(parseCents('$ 1.234,50')).toBe(123450);
    expect(parseCents('abc')).toBeNull();
  });
});
