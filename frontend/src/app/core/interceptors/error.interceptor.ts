import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../services/notification.service';

/**
 * Interceptor global de errores HTTP: muestra el mensaje del backend
 * (`detail`) en un snackbar y repropaga el error para la lógica local.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const message = error.error?.detail ?? 'Ocurrió un error inesperado.';
        notifications.error(message);
      }
      return throwError(() => error);
    }),
  );
};
