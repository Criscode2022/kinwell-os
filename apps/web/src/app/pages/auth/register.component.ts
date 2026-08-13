import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="grid min-h-screen place-items-center bg-linen px-4 py-10">
      <div class="card w-full max-w-md p-6 sm:p-8">
        <div class="mb-6 text-center">
          <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-bottle-600 font-display text-lg font-bold text-brass-400">K</div>
          <h1 class="font-display text-2xl font-semibold text-ink-900">Start a care book</h1>
          <p class="mt-1 text-sm text-ink-500">Free workspace for your household</p>
        </div>
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label class="label" for="name">Your name</label>
            <input id="name" class="input" formControlName="name" />
          </div>
          <div>
            <label class="label" for="email">Email</label>
            <input id="email" type="email" class="input" formControlName="email" />
          </div>
          <div>
            <label class="label" for="password">Password</label>
            <input id="password" type="password" class="input" formControlName="password" />
          </div>
          @if (error()) {
            <div class="rounded-xl border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-600">{{ error() }}</div>
          }
          <button class="btn-primary w-full" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Creating…' : 'Create workspace' }}</button>
        </form>
        <p class="mt-6 text-center text-sm text-ink-500">Already have one? <a routerLink="/login" class="font-semibold text-bottle-700 hover:underline">Sign in</a></p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => { this.loading.set(false); void this.router.navigateByUrl('/app'); },
      error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Unable to register'); },
    });
  }
}
