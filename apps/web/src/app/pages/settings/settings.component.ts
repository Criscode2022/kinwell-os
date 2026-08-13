import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-2xl space-y-6">
      <div>
        <p class="text-sm font-medium text-bottle-700">Workspace</p>
        <h1 class="font-display text-3xl font-semibold text-ink-900">Settings</h1>
        <p class="mt-1 text-sm text-ink-500">Your name and how Kinwell addresses you.</p>
      </div>
      <div class="card p-5 sm:p-6">
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="save()">
          <div><label class="label">Display name</label><input class="input" formControlName="name" /></div>
          <div><label class="label">Phone</label><input class="input" formControlName="phone" /></div>
          <div><label class="label">Timezone</label>
            <select class="input" formControlName="timezone">
              <option value="Europe/Madrid">Europe/Madrid</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Mexico_City">America/Mexico_City</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div class="rounded-xl bg-linen-50 px-3 py-2 text-sm text-ink-600">Signed in as <span class="font-semibold text-ink-900">{{ auth.user()?.email }}</span></div>
          @if (message()) { <div class="rounded-xl border border-bottle-200 bg-bottle-50 px-3 py-2 text-sm text-bottle-800">{{ message() }}</div> }
          <div class="flex justify-end"><button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">{{ saving() ? 'Saving…' : 'Save changes' }}</button></div>
        </form>
      </div>
      <div class="card p-5 text-sm text-ink-600">
        <h2 class="mb-2 font-semibold text-ink-900">Stack</h2>
        <ul class="space-y-1">
          <li>Frontend: Angular 19 + Tailwind CSS</li>
          <li>Backend: NestJS REST API (JWT)</li>
          <li>Database: Neon Postgres (PGLite fallback when DATABASE_URL is unset)</li>
        </ul>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: [''],
    timezone: ['Europe/Madrid'],
  });
  ngOnInit() {
    const u = this.auth.user();
    if (u) this.form.setValue({ name: u.name, phone: u.phone || '', timezone: u.timezone || 'Europe/Madrid' });
  }
  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.message.set('');
    this.api.updateProfile(this.form.getRawValue()).subscribe({
      next: (user) => { this.auth.setUser(user); this.saving.set(false); this.message.set('Profile updated.'); },
      error: () => this.saving.set(false),
    });
  }
}
