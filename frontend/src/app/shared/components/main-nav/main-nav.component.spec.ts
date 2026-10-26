import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainNavComponent } from './main-nav.component';

describe('MainNavComponent', () => {
  it('offers a home link and every main section in order', async () => {
    await TestBed.configureTestingModule({
      imports: [MainNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(MainNavComponent);
    await fixture.whenStable();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/clientes',
      '/inventario',
      '/ordenes',
      '/ventas',
    ]);
    expect(links[0].textContent?.trim()).toBe('Taller de Reparaciones');
  });
});
