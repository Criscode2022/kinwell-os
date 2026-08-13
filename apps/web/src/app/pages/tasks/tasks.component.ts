import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { CareTask, Person } from '../../core/models';
import { labelize, statusClass } from '../../core/format';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-medium text-bottle-700">Household</p>
          <h1 class="font-display text-3xl font-semibold text-ink-900">Care tasks</h1>
          <p class="mt-1 text-sm text-ink-500">Pharmacy runs, transport, paperwork — who owns what.</p>
        </div>
        <button type="button" class="btn-primary" (click)="openCreate()">Add task</button>
      </div>
      <div class="card overflow-hidden">
        <ul class="divide-y divide-ink-100">
          @for (t of tasks(); track t.id) {
            <li class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <div class="font-semibold text-ink-900">{{ t.title }}</div>
                <div class="text-xs text-ink-500">{{ t.personName || 'Household' }} · {{ labelize(t.category) }}@if (t.assignedTo) { · {{ t.assignedTo }} }@if (t.dueOn) { · due {{ t.dueOn | date:'d MMM' }} }</div>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge capitalize" [ngClass]="statusClass(t.status)">{{ labelize(t.status) }}</span>
                @if (t.status !== 'done') {
                  <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="mark(t)">Mark done</button>
                }
                <button type="button" class="btn-ghost !px-2 text-rose-600" (click)="remove(t)">Delete</button>
              </div>
            </li>
          } @empty { <li class="px-5 py-10 text-center text-sm text-ink-500">No tasks.</li> }
        </ul>
      </div>
    </div>
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/40 p-4 sm:items-center" (click)="showModal.set(false)">
        <div class="card w-full max-w-lg p-5 sm:p-6" (click)="$event.stopPropagation()">
          <h2 class="font-display text-xl font-semibold">New task</h2>
          <form class="mt-4 space-y-3" [formGroup]="form" (ngSubmit)="save()">
            <div><label class="label">Title</label><input class="input" formControlName="title" /></div>
            <div>
              <label class="label">Person</label>
              <select class="input" formControlName="personId">
                <option value="">Household</option>
                @for (p of people(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
              </select>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="label">Category</label>
                <select class="input" formControlName="category">
                  <option value="pharmacy">Pharmacy</option><option value="transport">Transport</option>
                  <option value="paperwork">Paperwork</option><option value="home">Home</option><option value="medical">Medical</option>
                </select>
              </div>
              <div><label class="label">Due</label><input class="input" type="date" formControlName="dueOn" /></div>
            </div>
            <div><label class="label">Assigned to</label><input class="input" formControlName="assignedTo" /></div>
            <div class="flex justify-end gap-2"><button type="button" class="btn-secondary" (click)="showModal.set(false)">Cancel</button><button class="btn-primary" type="submit" [disabled]="form.invalid || saving()">Save</button></div>
          </form>
        </div>
      </div>
    }
  `,
})
export class TasksComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly tasks = signal<CareTask[]>([]);
  readonly people = signal<Person[]>([]);
  readonly showModal = signal(false);
  readonly saving = signal(false);
  readonly labelize = labelize;
  readonly statusClass = statusClass;
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    personId: [''],
    category: ['home'],
    dueOn: [''],
    assignedTo: [''],
  });
  ngOnInit() { this.reload(); this.api.listPeople().subscribe((p) => this.people.set(p)); }
  reload() { this.api.listTasks().subscribe((rows) => this.tasks.set(rows)); }
  openCreate() { this.form.reset({ title: '', personId: '', category: 'home', dueOn: '', assignedTo: '' }); this.showModal.set(true); }
  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.api.createTask({ ...v, personId: v.personId || undefined }).subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.reload(); },
      error: () => this.saving.set(false),
    });
  }
  mark(t: CareTask) { this.api.updateTask(t.id, { status: 'done' }).subscribe(() => this.reload()); }
  remove(t: CareTask) { if (confirm('Delete this task?')) this.api.deleteTask(t.id).subscribe(() => this.reload()); }
}
