import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { EmergencyCard } from '../../core/models';
import { ageFrom, labelize } from '../../core/format';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (card(); as c) {
      <div class="mx-auto max-w-2xl space-y-4 print:max-w-none">
        <div class="flex items-center justify-between print:hidden">
          <a [routerLink]="['/app/people', c.id]" class="text-sm font-semibold text-bottle-700">← Back</a>
          <button type="button" class="btn-primary" (click)="print()">Print / save PDF</button>
        </div>
        <article class="card overflow-hidden border-2 border-bottle-700">
          <header class="bg-bottle-800 px-6 py-5 text-linen-50">
            <div class="text-xs font-semibold uppercase tracking-[0.2em] text-brass-400">Kinwell emergency card</div>
            <h1 class="mt-1 font-display text-3xl font-semibold">{{ c.preferredName || c.name }}</h1>
            <p class="text-sm text-bottle-100">{{ c.relationship }}@if (ageFrom(c.dateOfBirth); as a) { · {{ a }} years }@if (c.bloodType) { · blood {{ c.bloodType }} }</p>
          </header>
          <div class="space-y-4 p-6 text-sm">
            <section>
              <h2 class="text-xs font-semibold uppercase tracking-wide text-rose-600">Allergies</h2>
              <p class="mt-1 text-base font-semibold text-rose-600">{{ c.allergies || 'None recorded' }}</p>
            </section>
            <section>
              <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-500">Conditions</h2>
              <p class="mt-1">{{ c.conditions || '—' }}</p>
            </section>
            <section>
              <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-500">Medications</h2>
              <ul class="mt-1 divide-y divide-ink-100">
                @for (m of c.medications; track m.name) {
                  <li class="py-1.5">{{ m.name }} {{ m.dosage }} · {{ labelize(m.frequency) }} · {{ m.times }}</li>
                }
              </ul>
            </section>
            <section class="grid gap-3 sm:grid-cols-2">
              <div>
                <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-500">Physician</h2>
                <p class="mt-1">{{ c.physician || '—' }}<br />{{ c.physicianPhone }}</p>
              </div>
              <div>
                <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-500">Pharmacy</h2>
                <p class="mt-1">{{ c.pharmacy || '—' }}<br />{{ c.pharmacyPhone }}</p>
              </div>
            </section>
            <section>
              <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-500">Contacts</h2>
              <ul class="mt-1">
                @for (ct of c.contacts; track ct.id) {
                  <li>{{ ct.name }} — {{ ct.phone }} ({{ ct.relationship }})</li>
                }
              </ul>
            </section>
            <section>
              <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-500">Address</h2>
              <p class="mt-1">{{ c.address }} {{ c.city }}</p>
            </section>
          </div>
        </article>
      </div>
    }
  `,
})
export class CardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly card = signal<EmergencyCard | null>(null);
  readonly ageFrom = ageFrom;
  readonly labelize = labelize;
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.personCard(id).subscribe((c) => this.card.set(c));
  }
  print() { window.print(); }
}
