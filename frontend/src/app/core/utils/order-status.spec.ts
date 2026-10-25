import { nextStatuses } from './order-status';

describe('order-status', () => {
  it('exposes only the next valid status', () => {
    expect(nextStatuses('ingresado')).toEqual(['en_diagnostico']);
    expect(nextStatuses('en_reparacion')).toEqual(['listo']);
    expect(nextStatuses('entregado')).toEqual([]);
  });
});
