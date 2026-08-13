import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Appointment, AuthResponse, CareTask, DashboardSummary, EmergencyCard,
  JournalEntry, Medication, Person, TodayDoses, User,
} from './models';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';
  login(email: string, password: string) { return this.http.post<AuthResponse>(`${this.base}/auth/login`, { email, password }); }
  register(payload: { email: string; password: string; name: string; phone?: string }) { return this.http.post<AuthResponse>(`${this.base}/auth/register`, payload); }
  me() { return this.http.get<User>(`${this.base}/auth/me`); }
  updateProfile(payload: Partial<User>) { return this.http.patch<User>(`${this.base}/auth/me`, payload); }
  dashboard() { return this.http.get<DashboardSummary>(`${this.base}/dashboard`); }
  listPeople(q?: string) { let p = new HttpParams(); if (q) p = p.set('q', q); return this.http.get<Person[]>(`${this.base}/people`, { params: p }); }
  getPerson(id: string) { return this.http.get<Person>(`${this.base}/people/${id}`); }
  personCard(id: string) { return this.http.get<EmergencyCard>(`${this.base}/people/${id}/card`); }
  createPerson(body: Partial<Person>) { return this.http.post<Person>(`${this.base}/people`, body); }
  updatePerson(id: string, body: Partial<Person>) { return this.http.patch<Person>(`${this.base}/people/${id}`, body); }
  deletePerson(id: string) { return this.http.delete(`${this.base}/people/${id}`); }
  addContact(personId: string, body: Record<string, unknown>) { return this.http.post<Person>(`${this.base}/people/${personId}/contacts`, body); }
  listMeds(personId?: string) { let p = new HttpParams(); if (personId) p = p.set('personId', personId); return this.http.get<Medication[]>(`${this.base}/medications`, { params: p }); }
  createMed(body: Record<string, unknown>) { return this.http.post<Medication>(`${this.base}/medications`, body); }
  updateMed(id: string, body: Record<string, unknown>) { return this.http.patch<Medication>(`${this.base}/medications/${id}`, body); }
  deleteMed(id: string) { return this.http.delete(`${this.base}/medications/${id}`); }
  todayDoses(personId?: string) { let p = new HttpParams(); if (personId) p = p.set('personId', personId); return this.http.get<TodayDoses>(`${this.base}/doses/today`, { params: p }); }
  logDose(body: Record<string, unknown>) { return this.http.post(`${this.base}/doses`, body); }
  listAppointments(status?: string) { let p = new HttpParams(); if (status) p = p.set('status', status); return this.http.get<Appointment[]>(`${this.base}/appointments`, { params: p }); }
  createAppointment(body: Record<string, unknown>) { return this.http.post<Appointment>(`${this.base}/appointments`, body); }
  updateAppointment(id: string, body: Record<string, unknown>) { return this.http.patch<Appointment>(`${this.base}/appointments/${id}`, body); }
  deleteAppointment(id: string) { return this.http.delete(`${this.base}/appointments/${id}`); }
  listTasks(status?: string) { let p = new HttpParams(); if (status) p = p.set('status', status); return this.http.get<CareTask[]>(`${this.base}/tasks`, { params: p }); }
  createTask(body: Record<string, unknown>) { return this.http.post<CareTask>(`${this.base}/tasks`, body); }
  updateTask(id: string, body: Record<string, unknown>) { return this.http.patch<CareTask>(`${this.base}/tasks/${id}`, body); }
  deleteTask(id: string) { return this.http.delete(`${this.base}/tasks/${id}`); }
  listJournal(personId?: string) { let p = new HttpParams(); if (personId) p = p.set('personId', personId); return this.http.get<JournalEntry[]>(`${this.base}/journal`, { params: p }); }
  createJournal(body: Record<string, unknown>) { return this.http.post<JournalEntry>(`${this.base}/journal`, body); }
  deleteJournal(id: string) { return this.http.delete(`${this.base}/journal/${id}`); }
}
