import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-bottle-800 text-linen-50">
      <header class="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 lg:px-8">
        <div class="flex items-center gap-2">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-brass-500 font-display font-bold text-bottle-800">K</div>
          <span class="font-display text-xl font-semibold">Kinwell</span>
        </div>
        <div class="flex items-center gap-2">
          <a routerLink="/login" class="btn-ghost text-linen-100 hover:bg-white/10">Sign in</a>
          <a routerLink="/register" class="btn-primary bg-brass-500 text-bottle-800 hover:bg-brass-400">Start a care book</a>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-4 pb-20 pt-10 lg:px-8 lg:pt-16">
        <p class="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brass-400">
          For the sandwich generation
        </p>
        <h1 class="max-w-3xl font-display text-4xl font-semibold leading-[1.1] sm:text-6xl">
          The care book your family actually keeps.
        </h1>
        <p class="mt-5 max-w-2xl text-lg leading-relaxed text-bottle-100">
          Medications, appointments, tasks, and a daily journal — so siblings stop coordinating a parent’s care over WhatsApp threads at midnight.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a routerLink="/register" class="btn-primary bg-brass-500 text-bottle-800 hover:bg-brass-400">Create a workspace</a>
          <a routerLink="/login" class="btn-secondary border-white/15 bg-white/5 text-white hover:bg-white/10">Open the demo</a>
        </div>

        <div class="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (f of features; track f.title) {
            <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div class="text-2xl text-brass-400">{{ f.icon }}</div>
              <h2 class="mt-3 font-display text-lg font-semibold">{{ f.title }}</h2>
              <p class="mt-2 text-sm leading-relaxed text-bottle-100">{{ f.body }}</p>
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class LandingComponent {
  readonly features = [
    { icon: '▣', title: 'Today’s doses', body: 'A single morning list. Mark taken or skipped. See 7-day adherence without a spreadsheet.' },
    { icon: '◎', title: 'People you care for', body: 'Conditions, allergies, pharmacy, and emergency contacts living next to the medication list.' },
    { icon: '◷', title: 'Clinic days', body: 'Prep notes, fasting labs, and who is driving — not buried in a group chat.' },
    { icon: '▦', title: 'A real journal', body: 'Mood, sleep, appetite, and what actually happened. The story a doctor can use.' },
  ];
}
