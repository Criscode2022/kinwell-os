import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Person } from '../../core/models';
import { ageFrom } from '../../core/format';

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-medium text-bottle-700">Household</p>
          <h1 class="font-display text-3xl font-semibold text-ink-900">People</h1>
          <p class="mt-1 text-sm text-ink-500">Everyone you keep a care book for.</p>
        </div>
        <button type="button" class="btn-primary" (click)="openCreate()">Add person</button>
      </div>
      <input class="input sm:max-w-sm" placeholder="Search by name or city…" [value]="query()" (input)="onSearch($event)" />
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (p of people(); track p.id) {
          <a [routerLink]="['/app/people', p.id]" class="card p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-display text-xl font-semibold text-ink-900">{{ p.preferredName || p.name }}</div>
                <div class="text-sm text-ink-500">{{ p.relationship || 'Family' }}@if (ageFrom(p.dateOfBirth); as a) { · {{ a }} }</div>
              </div>
              <span class="h-10 w-10 rounded-2xl" [class]="p.color === 'brass' ? 'bg-brass-500/80' : 'bg-bottle-600'"></span>
            </div>
            <p class="mt-3 line-clamp-2 text-sm text-ink-600">{{ p.conditions || 'No conditions recorded.' }}</p>
            <div class="mt-4 flex gap-4 text-xs font-semibold text-ink-500">
              <span>{{ p.medicationCount ?? 0 }} meds</span>
              <span>{{ p.openTasks ?? 0 }} open tasks</span>
              <span>{{ p.city || '—' }}</span>
            </div>
          </a>
        } @empty {
          <div class="card col-span-full px-5 py-10 text-center text-sm text-ink-500">No people yet — add the first person you care for.</div>
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/40 p-4 sm:items-center" (click)="showModal.set(false)">
        <div class="card w-full max-w-lg p-5 sm:p-6" (click)="$event.stopPropagation()">
          <h2 class="font-display text-xl font-semibold text-ink-900">New person</h2>
          <form class="mt-4 space-y-3" [formGroup]="form" (ngSubmit)="save()">
            <div><label class="label">Full name</label><input class="input" formControlName="name" /></div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div><label class="label">Preferred name</label><input class="input" formControlName="preferredName" /></div>
              <div><label class="label">Relationship</label><input class="input" formControlName="relationship" placeholder="Mother, father-in-law…" /></div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div><label class="label">Date of birth</label><input class="input" type="date" formControlName="dateOfBirth" /></div>
              <div><label class="label">City</label><input class="input" formControlName="city" /></div>
            </div>
            <div><label class="label">Conditions</label><input class="input" formControlName="conditions" /></div>
            <div><label class="label">Allergies</label><input class="input" formControlName="allergies" /></div>
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
export class PeopleComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly people = signal<Person[]>([]);
  readonly query = signal('');
  readonly showModal = signal(false);
  readonly saving = signal(false);
  readonly ageFrom = ageFrom;
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    preferredName: [''],
    relationship: [''],
    dateOfBirth: [''],
    city: [''],
    conditions: [''],
    allergies: [''],
  });
  private timer: ReturnType<typeof setTimeout> | null = null;
  ngOnInit() { this.reload(); }
  reload() { this.api.listPeople(this.query() || undefined).subscribe((rows) => this.people.set(rows)); }
  onSearch(ev: Event) {
    this.query.set((ev.target as HTMLInputElement).value);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.reload(), 250);
  }
  openCreate() {
    this.form.reset({ name: '', preferredName: '', relationship: '', dateOfBirth: '', city: '', conditions: '', allergies: '' });
    this.showModal.set(true);
  }
  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.createPerson(this.form.getRawValue()).subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.reload(); },
      error: () => this.saving.set(false),
    });
  }
}
