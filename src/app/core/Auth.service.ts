import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginPayload { email: string; 
                                password: string; }
                                
export interface SessionUser {  id: string; 
                                nombre: string; 
                                email: string; 
                                telefono: string; 
                                rol: string; }

const KEY = 'g7_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);

    readonly currentUser = signal<SessionUser | null>(this.fromStorage());

    login(payload: LoginPayload): Observable<SessionUser> {
        return this.http.post<SessionUser>(`${environment.apiUrl}/auth/login`, payload).pipe(
            tap(user => this.setSession(user))
        );
    }

    setSession(user: SessionUser): void {
        this.currentUser.set(user);
        localStorage.setItem(KEY, JSON.stringify(user));
    }

    logout(): void {
        this.currentUser.set(null);
        localStorage.removeItem(KEY);
    }

    get isLoggedIn(): boolean { return this.currentUser() !== null; }
    get isAdmin(): boolean { return ['admin', 'administrador'].includes(this.userRole); }
    get isConductor(): boolean { return ['conductor', 'driver'].includes(this.userRole); }
    get userName(): string { return this.currentUser()?.nombre ?? 'Usuario'; }
    get userRole(): string { return this.normalizeRole(this.currentUser()?.rol ?? ''); }

    roleOf(user: SessionUser | null): string {
        return this.normalizeRole(user?.rol ?? '');
    }

    destinationFor(user: SessionUser | null): string {
        const role = this.roleOf(user);
        if (['admin', 'administrador'].includes(role)) return '/dash/overview';
        if (['conductor', 'driver'].includes(role)) return '/conductor';
        return '/home';
    }

    private normalizeRole(role: string): string {
        return String(role).trim().toLowerCase();
    }

    private fromStorage(): SessionUser | null {
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }
}
