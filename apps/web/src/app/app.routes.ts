import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing/landing.component').then((m) => m.LandingComponent) },
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/login.component').then((m) => m.LoginComponent) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/register.component').then((m) => m.RegisterComponent) },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'people', loadComponent: () => import('./pages/people/people.component').then((m) => m.PeopleComponent) },
      { path: 'people/:id', loadComponent: () => import('./pages/people/person.component').then((m) => m.PersonComponent) },
      { path: 'medications', loadComponent: () => import('./pages/medications/medications.component').then((m) => m.MedicationsComponent) },
      { path: 'appointments', loadComponent: () => import('./pages/appointments/appointments.component').then((m) => m.AppointmentsComponent) },
      { path: 'tasks', loadComponent: () => import('./pages/tasks/tasks.component').then((m) => m.TasksComponent) },
      { path: 'journal', loadComponent: () => import('./pages/journal/journal.component').then((m) => m.JournalComponent) },
      { path: 'card/:id', loadComponent: () => import('./pages/card/card.component').then((m) => m.CardComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
