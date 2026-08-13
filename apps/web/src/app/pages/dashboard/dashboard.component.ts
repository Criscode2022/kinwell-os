import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DashboardSummary, DoseSlot } from '../../core/models';
import { labelize, statusClass } from '../../core/format';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-medium text-bottle-700">Today</p>
          <h1 class="font-display text-3xl font-semibold text-ink-900">Good day, {{ firstName }}</h1>
          <p class="mt-1 text-sm text-ink-500">Doses, clinic days, and open care tasks.
            <span class="ml-1 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600">DB: {{ data()?.dbSource || '...' }}</span>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a routerLink="/app/medications" class="btn-secondary">Medications</a>
          <a routerLink="/app/people" class="btn-primary">Add a person</a>
        </div>
      </div>

      @if (loading()) {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (i of [1,2,3,4]; track i) { <div class="card h-28 animate-pulse bg-ink-100/60"></div> }
        </div>
      } @else {
        @if (data(); as d) {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="card p-5">
            <div class="text-xs font-semibold uppercase tracking-wide text-ink-500">7-day adherence</div>
            <div class="mt-2 font-display text-3xl font-semibold text-bottle-700">{{ d.kpis.adherence7d }}%</div>
            <div class="mt-1 text-xs text-ink-500">{{ d.kpis.takenToday }} taken today · {{ d.kpis.dueNow }} still due</div>
          </div>
          <div class="card p-5">
            <div class="text-xs font-semibold uppercase tracking-wide text-ink-500">People</div>
            <div class="mt-2 font-display text-3xl font-semibold text-ink-900">{{ d.kpis.people }}</div>
            <div class="mt-1 text-xs text-ink-500">in this care book</div>
          </div>
          <div class="card p-5">
            <div class="text-xs font-semibold uppercase tracking-wide text-ink-500">Upcoming clinics</div>
            <div class="mt-2 font-display text-3xl font-semibold text-ink-900">{{ d.kpis.upcomingAppointments }}</div>
            <div class="mt-1 text-xs text-ink-500">{{ d.kpis.openTasks }} open tasks</div>
          </div>
          <div class="card p-5">
            <div class="text-xs font-semibold uppercase tracking-wide text-ink-500">Low stock</div>
            <div class="mt-2 font-display text-3xl font-semibold" [class.text-rose-600]="d.kpis.lowStock > 0">{{ d.kpis.lowStock }}</div>
            <div class="mt-1 text-xs text-ink-500">medications ≤ 10 units</div>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-5">
          <div class="card overflow-hidden lg:col-span-3">
            <div class="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 class="font-display text-lg font-semibold text-ink-900">Today's doses</h2>
              <a routerLink="/app/medications" class="text-xs font-semibold text-bottle-700">All meds</a>
            </div>
            <ul class="divide-y divide-ink-100">
              @for (s of d.today; track s.medicationId + s.time) {
                <li class="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <div class="text-sm font-semibold text-ink-900">{{ s.name }} <span class="font-normal text-ink-500">{{ s.dosage }}</span></div>
                    <div class="text-xs text-ink-500">{{ s.personName }} · {{ s.time }} @if (s.withFood) { · with food }</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="badge capitalize" [ngClass]="statusClass(s.status)">{{ labelize(s.status) }}</span>
                    @if (s.status === 'due' || s.status === 'upcoming') {
                      <button type="button" class="btn-primary !px-3 !py-1.5 text-xs" (click)="log(s, 'taken')">Taken</button>
                      <button type="button" class="btn-ghost !px-2 !py-1.5 text-xs" (click)="log(s, 'skipped')">Skip</button>
                    }
                  </div>
                </li>
              } @empty {
                <li class="px-5 py-8 text-center text-sm text-ink-500">No scheduled doses today.</li>
              }
            </ul>
          </div>

          <div class="space-y-4 lg:col-span-2">
            <div class="card p-5">
              <h2 class="mb-3 font-display text-lg font-semibold text-ink-900">Next clinics</h2>
              <ul class="space-y-3">
                @for (a of d.nextAppointments; track a.id) {
                  <li>
                    <div class="text-sm font-semibold text-ink-900">{{ a.title }}</div>
                    <div class="text-xs text-ink-500">{{ a.person_name }} · {{ a.starts_at | date:'EEE d MMM, HH:mm' }}</div>
                  </li>
                } @empty { <li class="text-sm text-ink-500">Nothing scheduled.</li> }
              </ul>
            </div>
            <div class="card p-5">
              <h2 class="mb-3 font-display text-lg font-semibold text-ink-900">Open tasks</h2>
              <ul class="space-y-3">
                @for (t of d.nextTasks; track t.id) {
                  <li class="flex justify-between gap-2">
                    <div>
                      <div class="text-sm font-semibold text-ink-900">{{ t.title }}</div>
                      <div class="text-xs text-ink-500">{{ t.person_name || 'Household' }} · {{ t.category }}</div>
                    </div>
                    <span class="text-xs text-ink-400">{{ t.due_on | date:'d MMM' }}</span>
                  </li>
                } @empty { <li class="text-sm text-ink-500">All clear.</li> }
              </ul>
            </div>
          </div>
        </div>
        }
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly loading = signal(true);
  readonly data = signal<DashboardSummary | null>(null);
  readonly statusClass = statusClass;
  readonly labelize = labelize;
  get firstName() { return this.auth.user()?.name?.split(' ')[0] || 'there'; }
  ngOnInit() { this.reload(); }
  reload() {
    this.api.dashboard().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  log(slot: DoseSlot, status: string) {
    this.api.logDose({ medicationId: slot.medicationId, status, scheduledFor: slot.scheduledFor }).subscribe(() => this.reload());
  }
}
