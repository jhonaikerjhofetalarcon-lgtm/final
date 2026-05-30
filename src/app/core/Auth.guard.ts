import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './Auth.service';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn) return true;

    router.navigate(['/login']);
    return false;
};

export const adminGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn) return true;

    router.navigate(['/login']);
    return false;
};

export const conductorGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn) {
        router.navigate(['/login']);
        return false;
    }

    if (auth.isConductor) return true;

    router.navigate(auth.isAdmin ? ['/dash/overview'] : ['/home']);
    return false;
};
