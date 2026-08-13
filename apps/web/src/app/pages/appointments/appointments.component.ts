import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Appointment, Person } from '../../core/models';
import { labelize, statusClass } from '../../core/format';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-medium text-bottle-700">Calendar</p>
          <h1 class="font-display text-3xl font-semibold text-ink-900">Appointments</h1>
          <p class="mt-1 text-sm text-ink-500">Clinic days, labs, and who needs to be there.</p>
        </div>
        <button type="button" class="btn-primary" (click)="openCreate()">New appointment</button>
      </div>
      <div class="space-y-3">
        @for (a of appts(); track a.id) {
          <div class="card p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="font-display text-lg font-semibold text-ink-900">{{ a.title }}</div>
                <div class="text-sm text-ink-500">{{ a.personName }} · {{ a.startsAt | date:'EEE d MMM y, HH:mm' }}</div>
                <div class="mt-1 text-sm text-ink-600">{{ a.provider }}@if (a.location) { · {{ a.location }} }</div>
                @if (a.prepNotes) { <p class="mt-2 rounded-xl bg-brass-400/10 px-3 py-2 text-sm text-ink-700">Prep: {{ a.prepNotes }}</p> }
              </div>
              <div class="flex items-center gap-2">
                <span class="badge capitalize" [ngClass]="statusClass(a.status)">{{ labelize(a.status) }}</span>
                @if (a.status === 'scheduled') {
                  <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="mark(a, 'completed')">Done</button>
                }
                <button type="button" class="btn-ghost !px-2 text-rose-600" (click)="remove(a)">Delete</button>
              </div>
            </div>
          </div>
        } @empty { <div class="card px-5 py-10 text-center text-sm text-ink-500">No appointments yet.</div> }
      </div>
    </div>
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/40 p-4 sm:items-center" (click)="showModal.set(false)">
        <div class="card w-full max-w-lg p-5 sm:p-6" (click)="$event.stopPropagation()">
          <h2 class="font-display text-xl font-semibold">New appointment</h2>
          <form class="mt-4 space-y-3" [formGroup]="form" (ngSubmit)="save()">
            <div>
              <label class="label">Person</label>
              <select class="input" formControlName="personId">
                @for (p of people(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
              </select>
            </div>
            <div><label class="label">Title</label><input class="input" formControlName="title" /></div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div><label class="label">Starts</label><input class="input" type="datetime-local" formControlName="startsAt" /></div>
              <div>
                <label class="label">Kind</label>
                <select class="input" formControlName="kind">
                  <option value="gp">GP</option><option value="specialist">Specialist</option>
                  <option value="lab">Lab</option><option value="therapy">Therapy</option><option value="other">Other</option>
                </select>
              </div>
            </div>
            <div><label class="label">Provider</label><input class="input" formControlName="provider" /></div>
            <div><label class="label">Location</label><input class="input" formControlName="location" /></div>
            <div><label class="label">Prep notes</label><input class="input" formControlName="prepNotes" /></div>
            <div class="flex justify-end gap-2"><button type="button" class="btn-secondary" (click)="showModal.set(false)">Cancel</button><button class="btn-primary" type="submit" [disabled]="form.invalid || saving()">Save</button></div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AppointmentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly appts = signal<Appointment[]>([]);
  readonly people = signal<Person[]>([]);
  readonly showModal = signal(false);
  readonly saving = signal(false);
  readonly labelize = labelize;
  readonly statusClass = statusClass;
  readonly form = this.fb.nonNullable.group({
    personId: ['', Validators.required],
    title: ['', Validators.required],
    startsAt: ['', Validators.required],
    kind: ['gp'],
    provider: [''],
    location: [''],
    prepNotes: [''],
  });
  ngOnInit() { this.reload(); this.api.listPeople().subscribe((p) => this.people.set(p)); }
  reload() { this.api.listAppointments().subscribe((rows) => this.appts.set(rows)); }
  openCreate() {
    const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 24);
    this.form.reset({ personId: this.people()[0]?.id || '', title: '', startsAt: d.toISOString().slice(0, 16), kind: 'gp', provider: '', location: '', prepNotes: '' });
    this.showModal.set(true);
  }
  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.api.createAppointment({ ...v, startsAt: new Date(v.startsAt).toISOString() }).subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.reload(); },
      error: () => this.saving.set(false),
    });
  }
  mark(a: Appointment, status: string) { this.api.updateAppointment(a.id, { status }).subscribe(() => this.reload()); }
  remove(a: Appointment) { if (confirm('Delete this appointment?')) this.api.deleteAppointment(a.id).subscribe(() => this.reload()); }
}
