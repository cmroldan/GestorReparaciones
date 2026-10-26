import { TestBed } from '@angular/core/testing';

import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
    }).compileComponents();
  });

  it('renders an inline svg hidden from assistive technology', () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'grid');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement | null;

    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.querySelectorAll('path, rect, circle').length).toBeGreaterThan(0);
  });

  it('applies the requested size', () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'users');
    fixture.componentRef.setInput('size', 32);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;

    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
  });
});
