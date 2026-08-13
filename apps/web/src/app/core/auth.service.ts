import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError, of, map } from 'rxjs';
import { ApiService } from './api.service';
import { User } from './models';
const TOKEN_KEY = 'kinwell_token';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  readonly isAuthenticated = computed(() => !!this.user());
  get token(): string | null { return localStorage.getItem(TOKEN_KEY); }
  bootstrap() {
    if (!this.token) { this.loading.set(false); return of(null); }
    return this.api.me().pipe(
      tap((user) => { this.user.set(user); this.loading.set(false); }),
      catchError(() => { localStorage.removeItem(TOKEN_KEY); this.user.set(null); this.loading.set(false); return of(null); }),
    );
  }
  login(email: string, password: string) {
    return this.api.login(email, password).pipe(
      tap((res) => { localStorage.setItem(TOKEN_KEY, res.accessToken); this.user.set(res.user); }),
      map((res) => res.user),
    );
  }
  register(payload: { email: string; password: string; name: string; phone?: string }) {
    return this.api.register(payload).pipe(
      tap((res) => { localStorage.setItem(TOKEN_KEY, res.accessToken); this.user.set(res.user); }),
      map((res) => res.user),
    );
  }
  logout() { localStorage.removeItem(TOKEN_KEY); this.user.set(null); void this.router.navigateByUrl('/login'); }
  setUser(user: User) { this.user.set(user); }
}
