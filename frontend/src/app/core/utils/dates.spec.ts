import {
  APP_TIMEZONE,
  formatDateInArgentina,
  formatHeaderDateInArgentina,
  monthRangeInArgentina,
  todayInArgentina,
} from './dates';

describe('dates utilities', () => {
  it('uses the Argentina timezone', () => {
    expect(APP_TIMEZONE).toBe('America/Argentina/Buenos_Aires');
  });

  it('resolves the current day in Argentina near UTC midnight', () => {
    const lateNight = new Date('2026-11-01T02:30:00Z');

    expect(todayInArgentina(lateNight)).toBe('2026-10-31');
  });

  it('resolves the current day after Argentina midnight', () => {
    const afterMidnight = new Date('2026-11-01T03:30:00Z');

    expect(todayInArgentina(afterMidnight)).toBe('2026-11-01');
  });

  it('builds the month range from the first day to today', () => {
    const midMonth = new Date('2026-10-26T15:00:00Z');

    expect(monthRangeInArgentina(midMonth)).toEqual({
      from: '2026-10-01',
      to: '2026-10-26',
    });
  });

  it('keeps the same day for from and to on the first day of the month', () => {
    const firstDay = new Date('2026-10-01T15:00:00Z');

    expect(monthRangeInArgentina(firstDay)).toEqual({
      from: '2026-10-01',
      to: '2026-10-01',
    });
  });

  it('uses the local month when UTC is still on the previous month', () => {
    const nearMidnight = new Date('2026-11-01T02:30:00Z');

    expect(monthRangeInArgentina(nearMidnight)).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
    });
  });

  it('formats the header date in Spanish', () => {
    const date = new Date('2026-10-26T15:00:00Z');

    expect(formatHeaderDateInArgentina(date)).toBe('Lunes, 26 de octubre');
  });

  it('formats a timestamp in Argentina local time', () => {
    const timestamp = '2026-10-26T01:30:00Z';

    expect(formatDateInArgentina(timestamp)).toBe('25/10/2026');
  });
});
