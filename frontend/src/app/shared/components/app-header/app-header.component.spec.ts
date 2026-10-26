import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AppHeaderComponent } from './app-header.component';

@Component({ template: '' })
class BlankComponent {}

describe('AppHeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([
          { path: '', component: BlankComponent },
          { path: 'clientes', component: BlankComponent },
          { path: 'ordenes/:id', component: BlankComponent },
        ]),
      ],
    }).compileComponents();
  });

  it('shows the current section title and updates on navigation', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/clientes');

    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const heading = () =>
      (fixture.nativeElement.querySelector('h1') as HTMLElement).textContent?.trim();

    expect(heading()).toBe('Clientes');

    await router.navigateByUrl('/ordenes/7');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(heading()).toBe('Órdenes');
  });

  it('shows the current date in Argentine Spanish', async () => {
    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const date = (
      fixture.nativeElement.querySelector('time') as HTMLElement
    ).textContent?.trim();
    const expected = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());

    expect(date).toBe(expected.charAt(0).toUpperCase() + expected.slice(1));
  });
});
