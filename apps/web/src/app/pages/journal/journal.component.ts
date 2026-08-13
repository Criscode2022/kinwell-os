import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { JournalEntry, Person } from '../../core/models';
import { labelize, statusClass } from '../../core/format';

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-medium text-bottle-700">Notes</p>
          <h1 class="font-display text-3xl font-semibold text-ink-900">Journal</h1>
          <p class="mt-1 text-sm text-ink-500">What the day was actually like — mood, sleep, appetite, and the story.</p>
        </div>
        <button type="button" class="btn-primary" (click)="openCreate()">New entry</button>
      </div>
      <div class="space-y-3">
        @for (e of entries(); track e.id) {
          <article class="card p-5">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div class="font-display text-lg font-semibold text-ink-900">{{ e.personName }}</div>
                <div class="text-xs text-ink-500">{{ e.entryDate | date:'fullDate' }}</div>
              </div>
              <div class="flex gap-2">
                <span class="badge capitalize" [ngClass]="statusClass(e.mood)">mood {{ e.mood }}</span>
                <span class="badge capitalize" [ngClass]="statusClass(e.sleep)">sleep {{ e.sleep }}</span>
                <span class="badge capitalize" [ngClass]="statusClass(e.appetite)">appetite {{ e.appetite }}</span>
              </div>
            </div>
            <p class="mt-3 text-sm leading-relaxed text-ink-700">{{ e.body }}</p>
            <button type="button" class="btn-ghost mt-3 !px-2 text-xs text-rose-600" (click)="remove(e)">Delete</button>
          </article>
        } @empty { <div class="card px-5 py-10 text-center text-sm text-ink-500">No journal entries yet.</div> }
      </div>
    </div>
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/40 p-4 sm:items-center" (click)="showModal.set(false)">
        <div class="card w-full max-w-lg p-5 sm:p-6" (click)="$event.stopPropagation()">
          <h2 class="font-display text-xl font-semibold">New journal entry</h2>
          <form class="mt-4 space-y-3" [formGroup]="form" (ngSubmit)="save()">
            <div>
              <label class="label">Person</label>
              <select class="input" formControlName="personId">
                @for (p of people(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
              </select>
            </div>
            <div class="grid gap-3 sm:grid-cols-3">
              <div><label class="label">Mood</label><select class="input" formControlName="mood"><option>good</option><option>ok</option><option>low</option><option>unwell</option></select></div>
              <div><label class="label">Sleep</label><select class="input" formControlName="sleep"><option>good</option><option>ok</option><option>poor</option><option>restless</option></select></div>
              <div><label class="label">Appetite</label><select class="input" formControlName="appetite"><option>good</option><option>ok</option><option>low</option></select></div>
            </div>
            <div><label class="label">What happened</label><textarea class="input min-h-[120px]" formControlName="body"></textarea></div>
            <div class="flex justify-end gap-2"><button type="button" class="btn-secondary" (click)="showModal.set(false)">Cancel</button><button class="btn-primary" type="submit" [disabled]="form.invalid || saving()">Save</button></div>
          </form>
        </div>
      </div>
    }
  `,
})
export class JournalComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly entries = signal<JournalEntry[]>([]);
  readonly people = signal<Person[]>([]);
  readonly showModal = signal(false);
  readonly saving = signal(false);
  readonly labelize = labelize;
  readonly statusClass = statusClass;
  readonly form = this.fb.nonNullable.group({
    personId: ['', Validators.required],
    mood: ['ok'],
    sleep: ['ok'],
    appetite: ['ok'],
    body: [''],
  });
  ngOnInit() { this.reload(); this.api.listPeople().subscribe((p) => this.people.set(p)); }
  reload() { this.api.listJournal().subscribe((rows) => this.entries.set(rows)); }
  openCreate() { this.form.reset({ personId: this.people()[0]?.id || '', mood: 'ok', sleep: 'ok', appetite: 'ok', body: '' }); this.showModal.set(true); }
  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.createJournal(this.form.getRawValue()).subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.reload(); },
      error: () => this.saving.set(false),
    });
  }
  remove(e: JournalEntry) { if (confirm('Delete this entry?')) this.api.deleteJournal(e.id).subscribe(() => this.reload()); }
}
