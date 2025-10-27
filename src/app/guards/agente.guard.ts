import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/authService';

export const agenteGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const currentUser = auth.user;
  if (!currentUser) {
    router.navigate(['/login']);
    return false;
  }

  const rol = await auth.getUserRole(currentUser.uid);
  if (rol === 'agente') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
