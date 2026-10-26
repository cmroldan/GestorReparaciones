import { Item } from '../models/item.model';

const ITEM_CODE_PATTERN = /^SKU-(\d+)$/;
const ITEM_CODE_PREFIX = 'SKU-';
const ITEM_CODE_PADDING = 4;

export function nextItemCode(items: ReadonlyArray<Pick<Item, 'code'>>): string {
  const highest = items.reduce((max, item) => {
    const match = ITEM_CODE_PATTERN.exec(item.code);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `${ITEM_CODE_PREFIX}${String(highest + 1).padStart(ITEM_CODE_PADDING, '0')}`;
}
