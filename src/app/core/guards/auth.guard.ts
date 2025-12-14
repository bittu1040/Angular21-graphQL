import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, switchMap, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If already authenticated in memory, allow access
  if (authService.isAuthenticated()) {
    return true;
  }

  // Otherwise, verify with server
  return authService.checkAuthStatus().pipe(
    switchMap((isAuthenticated) => {
      if (!isAuthenticated) {
        return of(router.createUrlTree(['/login']));
      }

      // If authenticated but profile not loaded, hydrate it
      if (!authService.user()) {
        return authService.fetchProfile().pipe(
          map(() => true),
          catchError(() => of(router.createUrlTree(['/login'])))
        );
      }

      return of(true);
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect to dashboard if already authenticated
  return router.createUrlTree(['/dashboard']);
};
