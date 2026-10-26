import { nextItemCode } from './item-code';

describe('nextItemCode', () => {
  it('starts at SKU-0001 when there are no items', () => {
    expect(nextItemCode([])).toBe('SKU-0001');
  });

  it('continues from the highest numeric SKU suffix', () => {
    expect(
      nextItemCode([{ code: 'SKU-0007' }, { code: 'SKU-0002' }, { code: 'FUENTE-01' }]),
    ).toBe('SKU-0008');
  });

  it('ignores malformed and lower-case codes', () => {
    expect(nextItemCode([{ code: 'SKU-abc' }, { code: 'sku-0099' }])).toBe('SKU-0001');
  });
});
