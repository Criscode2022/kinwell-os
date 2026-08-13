import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="relative min-h-screen overflow-hidden bg-bottle-800">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -left-20 top-16 h-72 w-72 rounded-full bg-brass-500/15 blur-3xl"></div>
        <div class="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-bottle-400/10 blur-3xl"></div>
      </div>
      <div class="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:px-8">
        <div class="text-linen-50">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brass-400">Family caregiver OS</div>
          <h1 class="font-display text-4xl font-semibold leading-tight sm:text-5xl">One book for the people you look after.</h1>
          <p class="mt-4 max-w-lg text-base leading-relaxed text-bottle-100">Kinwell keeps doses, clinic days, and sibling tasks in one calm place — built for real households, not hospital IT.</p>
        </div>
        <div class="card p-6 sm:p-8">
          <h2 class="font-display text-2xl font-semibold text-ink-900">Welcome back</h2>
          <p class="mt-1 text-sm text-ink-500">Sign in to your care book</p>
          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div>
              <label class="label" for="email">Email</label>
              <input id="email" class="input" type="email" formControlName="email" autocomplete="email" />
            </div>
            <div>
              <label class="label" for="password">Password</label>
              <input id="password" class="input" type="password" formControlName="password" autocomplete="current-password" />
            </div>
            @if (error()) {
              <div class="rounded-xl border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-600">{{ error() }}</div>
            }
            <button class="btn-primary w-full" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Signing in…' : 'Sign in' }}</button>
          </form>
          <div class="mt-5 rounded-xl border border-dashed border-ink-200 bg-linen-50 p-3 text-xs text-ink-600">
            <div class="font-semibold text-ink-800">Demo household</div>
            <div class="mt-1">demo&#64;kinwell.app / demo1234</div>
            <button type="button" class="btn-ghost mt-2 !px-2 !py-1 text-bottle-700" (click)="fillDemo()">Use demo credentials</button>
          </div>
          <p class="mt-6 text-center text-sm text-ink-500">New here? <a routerLink="/register" class="font-semibold text-bottle-700 hover:underline">Create a care book</a></p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  fillDemo() { this.form.setValue({ email: 'demo@kinwell.app', password: 'demo1234' }); }
  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => { this.loading.set(false); void this.router.navigateByUrl('/app'); },
      error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Unable to sign in'); },
    });
  }
}
