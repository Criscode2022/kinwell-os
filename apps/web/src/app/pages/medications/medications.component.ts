import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Medication, Person } from '../../core/models';
import { labelize, statusClass } from '../../core/format';

@Component({
  selector: 'app-medications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-medium text-bottle-700">Regimen</p>
          <h1 class="font-display text-3xl font-semibold text-ink-900">Medications</h1>
          <p class="mt-1 text-sm text-ink-500">Active prescriptions, refills, and how they are taken.</p>
        </div>
        <button type="button" class="btn-primary" (click)="openCreate()">Add medication</button>
      </div>
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-linen-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th class="px-4 py-3 font-semibold">Medicine</th>
                <th class="px-4 py-3 font-semibold">For</th>
                <th class="px-4 py-3 font-semibold">Schedule</th>
                <th class="px-4 py-3 font-semibold">Stock</th>
                <th class="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              @for (m of meds(); track m.id) {
                <tr class="hover:bg-linen-50/80">
                  <td class="px-4 py-3">
                    <div class="font-semibold text-ink-900">{{ m.name }} <span class="font-normal text-ink-500">{{ m.dosage }}</span></div>
                    <div class="text-xs text-ink-400">{{ m.form }}@if (m.withFood) { · with food }</div>
                  </td>
                  <td class="px-4 py-3 text-ink-700">{{ m.personName }}</td>
                  <td class="px-4 py-3"><span class="badge capitalize" [ngClass]="statusClass(m.active ? 'active' : 'done')">{{ labelize(m.frequency) }}</span>
                    <div class="mt-1 text-xs text-ink-400">{{ m.times }}</div></td>
                  <td class="px-4 py-3" [class.text-rose-600]="m.quantity <= 10">{{ m.quantity }} · {{ m.refillsLeft }} refills</td>
                  <td class="px-4 py-3 text-right">
                    <button type="button" class="btn-ghost !px-2 text-rose-600" (click)="remove(m)">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="px-4 py-10 text-center text-ink-500">No medications yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/40 p-4 sm:items-center" (click)="showModal.set(false)">
        <div class="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6" (click)="$event.stopPropagation()">
          <h2 class="font-display text-xl font-semibold text-ink-900">New medication</h2>
          <form class="mt-4 space-y-3" [formGroup]="form" (ngSubmit)="save()">
            <div>
              <label class="label">Person</label>
              <select class="input" formControlName="personId">
                <option value="" disabled>Select</option>
                @for (p of people(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
              </select>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div><label class="label">Name</label><input class="input" formControlName="name" /></div>
              <div><label class="label">Dosage</label><input class="input" formControlName="dosage" placeholder="10 mg" /></div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="label">Frequency</label>
                <select class="input" formControlName="frequency">
                  <option value="daily">Daily</option>
                  <option value="twice_daily">Twice daily</option>
                  <option value="three_daily">Three times</option>
                  <option value="weekly">Weekly</option>
                  <option value="as_needed">As needed</option>
                </select>
              </div>
              <div><label class="label">Times</label><input class="input" formControlName="times" placeholder="08:00,20:00" /></div>
            </div>
            <div><label class="label">Instructions</label><input class="input" formControlName="instructions" /></div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn-secondary" (click)="showModal.set(false)">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">Save</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class MedicationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly meds = signal<Medication[]>([]);
  readonly people = signal<Person[]>([]);
  readonly showModal = signal(false);
  readonly saving = signal(false);
  readonly labelize = labelize;
  readonly statusClass = statusClass;
  readonly form = this.fb.nonNullable.group({
    personId: ['', Validators.required],
    name: ['', Validators.required],
    dosage: [''],
    frequency: ['daily'],
    times: ['08:00'],
    instructions: [''],
  });
  ngOnInit() {
    this.reload();
    this.api.listPeople().subscribe((p) => this.people.set(p));
  }
  reload() { this.api.listMeds().subscribe((rows) => this.meds.set(rows)); }
  openCreate() { this.form.reset({ personId: this.people()[0]?.id || '', name: '', dosage: '', frequency: 'daily', times: '08:00', instructions: '' }); this.showModal.set(true); }
  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.createMed(this.form.getRawValue()).subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.reload(); },
      error: () => this.saving.set(false),
    });
  }
  remove(m: Medication) {
    if (!confirm(`Remove ${m.name}?`)) return;
    this.api.deleteMed(m.id).subscribe(() => this.reload());
  }
}
