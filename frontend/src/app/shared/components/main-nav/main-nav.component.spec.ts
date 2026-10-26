import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { MainNavComponent } from './main-nav.component';

@Component({ template: '' })
class BlankComponent {}

describe('MainNavComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainNavComponent],
      providers: [
        provideRouter([
          { path: '', component: BlankComponent },
          { path: 'clientes', component: BlankComponent },
          { path: 'clientes/:id', component: BlankComponent },
          { path: 'inventario', component: BlankComponent },
          { path: 'ordenes', component: BlankComponent },
          { path: 'ordenes/:id', component: BlankComponent },
          { path: 'ventas', component: BlankComponent },
          { path: 'ventas/historial', component: BlankComponent },
        ]),
      ],
    }).compileComponents();
  });

  it('offers the five main sections in order', async () => {
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
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Resumen',
      'Clientes',
      'Inventario',
      'Órdenes',
      'Ventas',
    ]);
  });

  it('marks the current section as the active page', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/clientes');

    const fixture = TestBed.createComponent(MainNavComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const active = fixture.nativeElement.querySelector(
      'a[aria-current="page"]',
    ) as HTMLAnchorElement | null;

    expect(active?.textContent?.trim()).toBe('Clientes');
  });

  it('keeps the parent section active on detail routes', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/ordenes/7');

    const fixture = TestBed.createComponent(MainNavComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const active = fixture.nativeElement.querySelector(
      'a[aria-current="page"]',
    ) as HTMLAnchorElement | null;

    expect(active?.textContent?.trim()).toBe('Órdenes');
  });
});
