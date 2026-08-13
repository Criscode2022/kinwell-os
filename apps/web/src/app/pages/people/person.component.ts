import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Person } from '../../core/models';
import { ageFrom } from '../../core/format';

@Component({
  selector: 'app-person',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    @if (person(); as p) {
      <div class="space-y-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <a routerLink="/app/people" class="text-sm font-semibold text-bottle-700">← People</a>
            <h1 class="mt-1 font-display text-3xl font-semibold text-ink-900">{{ p.preferredName || p.name }}</h1>
            <p class="text-sm text-ink-500">{{ p.relationship }}@if (ageFrom(p.dateOfBirth); as a) { · {{ a }} years }@if (p.city) { · {{ p.city }} }</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a [routerLink]="['/app/card', p.id]" class="btn-secondary">Emergency card</a>
            <button type="button" class="btn-ghost text-rose-600" (click)="remove()">Delete</button>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <div class="card p-5 lg:col-span-2">
            <h2 class="font-display text-lg font-semibold text-ink-900">Clinical snapshot</h2>
            <dl class="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div><dt class="text-xs uppercase tracking-wide text-ink-500">Conditions</dt><dd class="mt-1 text-ink-800">{{ p.conditions || '—' }}</dd></div>
              <div><dt class="text-xs uppercase tracking-wide text-ink-500">Allergies</dt><dd class="mt-1 font-semibold text-rose-600">{{ p.allergies || 'None recorded' }}</dd></div>
              <div><dt class="text-xs uppercase tracking-wide text-ink-500">Blood type</dt><dd class="mt-1">{{ p.bloodType || '—' }}</dd></div>
              <div><dt class="text-xs uppercase tracking-wide text-ink-500">Physician</dt><dd class="mt-1">{{ p.physician || '—' }}<div class="text-ink-500">{{ p.physicianPhone }}</div></dd></div>
              <div><dt class="text-xs uppercase tracking-wide text-ink-500">Pharmacy</dt><dd class="mt-1">{{ p.pharmacy || '—' }}<div class="text-ink-500">{{ p.pharmacyPhone }}</div></dd></div>
              <div><dt class="text-xs uppercase tracking-wide text-ink-500">Address</dt><dd class="mt-1">{{ p.address || '—' }}</dd></div>
            </dl>
            @if (p.notes) { <p class="mt-4 rounded-xl bg-linen-50 p-3 text-sm text-ink-700">{{ p.notes }}</p> }
          </div>
          <div class="card p-5">
            <h2 class="font-display text-lg font-semibold text-ink-900">Emergency contacts</h2>
            <ul class="mt-3 space-y-3">
              @for (c of p.contacts; track c.id) {
                <li>
                  <div class="text-sm font-semibold text-ink-900">{{ c.name }} @if (c.isPrimary) { <span class="badge bg-bottle-50 text-bottle-700">Primary</span> }</div>
                  <div class="text-xs text-ink-500">{{ c.relationship }} · {{ c.phone }}</div>
                </li>
              } @empty { <li class="text-sm text-ink-500">No contacts yet.</li> }
            </ul>
            <form class="mt-4 space-y-2 border-t border-ink-100 pt-4" [formGroup]="contactForm" (ngSubmit)="addContact()">
              <input class="input" placeholder="Name" formControlName="name" />
              <div class="grid grid-cols-2 gap-2">
                <input class="input" placeholder="Relation" formControlName="relationship" />
                <input class="input" placeholder="Phone" formControlName="phone" />
              </div>
              <button class="btn-secondary w-full" type="submit" [disabled]="contactForm.invalid">Add contact</button>
            </form>
          </div>
        </div>
      </div>
    }
  `,
})
export class PersonComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly person = signal<Person | null>(null);
  readonly ageFrom = ageFrom;
  readonly contactForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    relationship: [''],
    phone: [''],
  });
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getPerson(id).subscribe((p) => this.person.set(p));
  }
  addContact() {
    const p = this.person();
    if (!p || this.contactForm.invalid) return;
    this.api.addContact(p.id, this.contactForm.getRawValue()).subscribe((updated) => {
      this.person.set(updated);
      this.contactForm.reset({ name: '', relationship: '', phone: '' });
    });
  }
  remove() {
    const p = this.person();
    if (!p || !confirm(`Remove ${p.name} from this care book?`)) return;
    this.api.deletePerson(p.id).subscribe(() => void this.router.navigateByUrl('/app/people'));
  }
}
