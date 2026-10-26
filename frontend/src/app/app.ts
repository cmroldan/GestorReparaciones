import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MainNavComponent } from './shared/components/main-nav/main-nav.component';

@Component({
  imports: [RouterOutlet, MainNavComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Taller de Reparaciones');
}
