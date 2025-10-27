import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/authService';

export const publicidadGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const currentUser = auth.user;
  if (!currentUser) {
    router.navigate(['/login']);
    return false;
  }

  const rol = await auth.getUserRole(currentUser.uid);
  if (rol === 'cliente') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
