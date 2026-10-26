import { sectionTitle } from './section-title';

describe('sectionTitle', () => {
  it('returns Resumen for the home route', () => {
    expect(sectionTitle('/')).toBe('Resumen');
    expect(sectionTitle('')).toBe('Resumen');
  });

  it('returns the section title for each listing route', () => {
    expect(sectionTitle('/clientes')).toBe('Clientes');
    expect(sectionTitle('/inventario')).toBe('Inventario');
    expect(sectionTitle('/ordenes')).toBe('Órdenes');
    expect(sectionTitle('/ventas')).toBe('Ventas');
  });

  it('keeps the parent section title on detail routes', () => {
    expect(sectionTitle('/clientes/12')).toBe('Clientes');
    expect(sectionTitle('/ordenes/7')).toBe('Órdenes');
    expect(sectionTitle('/ventas/historial')).toBe('Ventas');
  });

  it('ignores query strings and trailing slashes', () => {
    expect(sectionTitle('/ordenes/7?tab=items')).toBe('Órdenes');
    expect(sectionTitle('/clientes/')).toBe('Clientes');
  });

  it('falls back to Resumen for an unknown URL', () => {
    expect(sectionTitle('/desconocido')).toBe('Resumen');
  });
});
