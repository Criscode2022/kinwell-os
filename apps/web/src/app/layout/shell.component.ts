import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <header class="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-linen-50/90 px-4 py-3 backdrop-blur lg:hidden">
        <div class="flex items-center gap-2">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-bottle-600 font-display text-sm font-bold text-brass-400">K</div>
          <span class="font-display text-lg font-semibold text-ink-900">Kinwell</span>
        </div>
        <button type="button" class="btn-secondary !px-3" (click)="menuOpen.set(!menuOpen())">Menu</button>
      </header>

      <aside class="fixed inset-y-0 left-0 z-40 w-64 transform border-r border-bottle-800 bg-bottle-800 text-linen-100 transition lg:static lg:w-auto lg:translate-x-0"
             [class.-translate-x-full]="!menuOpen()" [class.translate-x-0]="menuOpen()">
        <div class="flex h-full flex-col">
          <div class="hidden items-center gap-3 px-5 py-6 lg:flex">
            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brass-500 font-display text-lg font-bold text-bottle-800">K</div>
            <div>
              <div class="font-display text-xl font-semibold text-linen-50">Kinwell</div>
              <div class="text-xs text-bottle-200">Family care book</div>
            </div>
          </div>
          <nav class="flex-1 space-y-1 px-3 py-4">
            @for (item of nav; track item.path) {
              <a [routerLink]="item.path" routerLinkActive="bg-white/10 text-white" [routerLinkActiveOptions]="{exact: item.exact}"
                 class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-bottle-100 transition hover:bg-white/5 hover:text-white"
                 (click)="menuOpen.set(false)">
                <span class="w-4 text-center opacity-80">{{ item.icon }}</span>
                {{ item.label }}
              </a>
            }
          </nav>
          <div class="border-t border-white/10 p-4">
            <div class="mb-3 rounded-2xl bg-white/5 p-3">
              <div class="text-sm font-semibold text-white">{{ auth.user()?.name || 'Account' }}</div>
              <div class="truncate text-xs text-bottle-200">{{ auth.user()?.email }}</div>
            </div>
            <button type="button" class="btn-secondary w-full border-white/10 bg-transparent text-linen-100 hover:bg-white/10" (click)="auth.logout()">Sign out</button>
          </div>
        </div>
      </aside>

      @if (menuOpen()) {
        <div class="fixed inset-0 z-30 bg-ink-950/40 lg:hidden" (click)="menuOpen.set(false)"></div>
      }

      <main class="min-w-0">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly menuOpen = signal(false);
  readonly nav = [
    { path: '/app', label: 'Today', icon: '◈', exact: true },
    { path: '/app/people', label: 'People', icon: '◎', exact: false },
    { path: '/app/medications', label: 'Medications', icon: '▣', exact: false },
    { path: '/app/appointments', label: 'Appointments', icon: '◷', exact: false },
    { path: '/app/tasks', label: 'Tasks', icon: '✓', exact: false },
    { path: '/app/journal', label: 'Journal', icon: '▦', exact: false },
    { path: '/app/settings', label: 'Settings', icon: '⚙', exact: false },
  ];
}
