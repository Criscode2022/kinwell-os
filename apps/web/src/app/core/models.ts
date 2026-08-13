export interface User {
  id: string; email: string; name: string; phone: string; timezone: string;
}
export interface AuthResponse { accessToken: string; user: User; }
export interface Contact { id: string; name: string; relationship: string; phone: string; isPrimary: boolean; }
export interface Person {
  id: string; name: string; preferredName: string; dateOfBirth: string | null; sex: string;
  relationship: string; conditions: string; allergies: string; bloodType: string;
  physician: string; physicianPhone: string; pharmacy: string; pharmacyPhone: string;
  address: string; city: string; notes: string; color: string;
  medicationCount?: number; openTasks?: number; contacts?: Contact[];
}
export interface Medication {
  id: string; personId: string; personName?: string | null; name: string; genericName: string;
  dosage: string; form: string; frequency: string; times: string; withFood: boolean;
  instructions: string; prescriber: string; quantity: number; refillsLeft: number;
  startDate: string | null; active: boolean; notes: string;
}
export interface DoseSlot {
  medicationId: string; personId: string; personName: string; name: string; dosage: string;
  form: string; withFood: boolean; instructions: string; scheduledFor: string; time: string;
  status: string; logId: string | null;
}
export interface TodayDoses { slots: DoseSlot[]; adherence7d: number; taken7d: number; total7d: number; }
export interface Appointment {
  id: string; personId: string; personName?: string | null; title: string; provider: string;
  location: string; kind: string; startsAt: string; endsAt: string | null; status: string;
  prepNotes: string; notes: string;
}
export interface CareTask {
  id: string; personId: string | null; personName?: string | null; title: string; description: string;
  category: string; dueOn: string | null; status: string; assignedTo: string;
}
export interface JournalEntry {
  id: string; personId: string; personName?: string | null; entryDate: string;
  mood: string; appetite: string; sleep: string; body: string; createdAt: string;
}
export interface DashboardSummary {
  kpis: {
    people: number; openTasks: number; upcomingAppointments: number; lowStock: number;
    dueNow: number; takenToday: number; adherence7d: number;
  };
  today: DoseSlot[];
  nextAppointments: { id: string; title: string; starts_at: string; location: string; kind: string; person_name: string }[];
  nextTasks: { id: string; title: string; due_on: string | null; category: string; status: string; person_name: string | null }[];
  recentJournal: { id: string; entry_date: string; mood: string; body: string; person_name: string }[];
  dbSource: string;
}
export interface EmergencyCard extends Person {
  medications: { name: string; dosage: string; frequency: string; times: string; instructions: string }[];
}
