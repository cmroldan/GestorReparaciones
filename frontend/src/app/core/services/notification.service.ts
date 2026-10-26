import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Notificaciones (snackbars) con textos en español, reutilizables en toda la app. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, 3000);
  }

  error(message: string): void {
    this.open(message, 5000);
  }

  info(message: string): void {
    this.open(message, 3000);
  }

  private open(message: string, duration: number): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
