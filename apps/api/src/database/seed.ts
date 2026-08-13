import { randomUUID } from 'crypto';

type Db = {
  queryOne<T extends Record<string, unknown>>(text: string, params?: unknown[]): Promise<T | null>;
  exec(text: string, params?: unknown[]): Promise<number>;
};

export async function seedIfEmpty(db: Db): Promise<boolean> {
  const existing = await db.queryOne<{ c: string }>(`select count(*)::text as c from users`);
  if (existing && Number(existing.c) > 0) return false;

  const bcrypt = await import('bcrypt');
  const userId = randomUUID();
  const passwordHash = await bcrypt.hash('demo1234', 10);
  await db.exec(
    `insert into users (id, email, password_hash, name, phone, timezone) values ($1,$2,$3,$4,$5,$6)`,
    [userId, 'demo@kinwell.app', passwordHash, 'Elena Vargas', '+34 612 880 441', 'Europe/Madrid'],
  );

  const carmen = randomUUID();
  const tomas = randomUUID();

  await db.exec(
    `insert into people (id,user_id,name,preferred_name,date_of_birth,sex,relationship,conditions,allergies,blood_type,physician,physician_phone,pharmacy,pharmacy_phone,address,city,notes,color)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      carmen, userId, 'Carmen Ruiz Molina', 'Carmen', '1947-03-12', 'female', 'Mother',
      "Type 2 diabetes; hypertension; early Alzheimer's",
      'Penicillin; iodine contrast', 'A+',
      'Dra. Isabel Ferrer (GP)', '+34 963 220 118',
      'Farmacia Ruzafa', '+34 963 441 902',
      'Carrer de Russafa 41, 3o', 'Valencia',
      'Lives alone. Neighbour has spare key. Prefers morning visits.',
      'bottle',
    ],
  );
  await db.exec(
    `insert into people (id,user_id,name,preferred_name,date_of_birth,sex,relationship,conditions,allergies,blood_type,physician,physician_phone,pharmacy,pharmacy_phone,address,city,notes,color)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      tomas, userId, 'Tomas Vargas Leon', 'Tomas', '1950-11-04', 'male', 'Father-in-law',
      'COPD; osteoarthritis', 'Aspirin', 'O+',
      'Dr. Pau Serra (pulmonology)', '+34 915 667 201',
      'Farmacia Chamberi', '+34 914 220 331',
      'Calle de Fuencarral 88, 2o A', 'Madrid',
      'Uses walker outdoors. Oxygen concentrator at night.',
      'brass',
    ],
  );

  const contacts: Array<{ personId: string; name: string; rel: string; phone: string; primary: boolean }> = [
    { personId: carmen, name: 'Elena Vargas', rel: 'Daughter / primary', phone: '+34 612 880 441', primary: true },
    { personId: carmen, name: 'Luis Ruiz', rel: 'Son', phone: '+34 600 119 228', primary: false },
    { personId: carmen, name: 'Conserje - Edificio Russafa', rel: 'Building', phone: '+34 963 110 044', primary: false },
    { personId: tomas, name: 'Elena Vargas', rel: 'Daughter-in-law', phone: '+34 612 880 441', primary: true },
    { personId: tomas, name: 'Miguel Vargas', rel: 'Son', phone: '+34 622 441 090', primary: false },
  ];
  for (const c of contacts) {
    await db.exec(
      `insert into contacts (id,user_id,person_id,name,relationship,phone,is_primary) values ($1,$2,$3,$4,$5,$6,$7)`,
      [randomUUID(), userId, c.personId, c.name, c.rel, c.phone, c.primary],
    );
  }

  const mEnalapril = randomUUID();
  const mMetformin = randomUUID();
  const mAtorva = randomUUID();
  const mDonepezil = randomUUID();
  const mTio = randomUUID();
  const mPara = randomUUID();

  type Med = {
    id: string; personId: string; name: string; genericName: string; dosage: string;
    form: string; frequency: string; times: string; withFood: boolean;
    instructions: string; prescriber: string; quantity: number; refills: number;
  };
  const meds: Med[] = [
    { id: mEnalapril, personId: carmen, name: 'Enalapril', genericName: 'enalapril', dosage: '10 mg', form: 'tablet', frequency: 'daily', times: '08:00', withFood: true, instructions: 'With breakfast. Watch for dizziness.', prescriber: 'Dra. Ferrer', quantity: 28, refills: 2 },
    { id: mMetformin, personId: carmen, name: 'Metformin', genericName: 'metformin', dosage: '850 mg', form: 'tablet', frequency: 'twice_daily', times: '08:00,20:00', withFood: true, instructions: 'With meals. Stop 48h before contrast.', prescriber: 'Dra. Ferrer', quantity: 56, refills: 1 },
    { id: mAtorva, personId: carmen, name: 'Atorvastatin', genericName: 'atorvastatin', dosage: '20 mg', form: 'tablet', frequency: 'daily', times: '21:00', withFood: false, instructions: 'Evening dose.', prescriber: 'Dra. Ferrer', quantity: 30, refills: 3 },
    { id: mDonepezil, personId: carmen, name: 'Donepezil', genericName: 'donepezil', dosage: '5 mg', form: 'tablet', frequency: 'daily', times: '21:00', withFood: false, instructions: 'May cause vivid dreams.', prescriber: 'Dr. Navarro (neuro)', quantity: 30, refills: 1 },
    { id: mTio, personId: tomas, name: 'Tiotropium', genericName: 'tiotropium', dosage: '18 mcg', form: 'inhaler', frequency: 'daily', times: '08:00', withFood: false, instructions: 'One capsule via HandiHaler.', prescriber: 'Dr. Serra', quantity: 30, refills: 2 },
    { id: mPara, personId: tomas, name: 'Paracetamol', genericName: 'paracetamol', dosage: '500 mg', form: 'tablet', frequency: 'as_needed', times: '08:00', withFood: false, instructions: 'Max 3g/day. For joint pain.', prescriber: 'Dr. Serra', quantity: 20, refills: 0 },
  ];
  for (const m of meds) {
    await db.exec(
      `insert into medications (id,user_id,person_id,name,generic_name,dosage,form,frequency,times,with_food,instructions,prescriber,quantity,refills_left,start_date,active)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,current_date - 90,true)`,
      [m.id, userId, m.personId, m.name, m.genericName, m.dosage, m.form, m.frequency, m.times, m.withFood, m.instructions, m.prescriber, m.quantity, m.refills],
    );
  }

  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
  const isoDay = (d: Date, hh: number, mm = 0) => {
    const x = new Date(d);
    x.setHours(hh, mm, 0, 0);
    return x.toISOString();
  };
  const logDose = async (medId: string, personId: string, when: string, status: string) => {
    await db.exec(
      `insert into dose_logs (id,user_id,medication_id,person_id,scheduled_for,status,taken_at) values ($1,$2,$3,$4,$5,$6,$7)`,
      [randomUUID(), userId, medId, personId, when, status, status === 'taken' ? when : null],
    );
  };
  for (let d = 1; d <= 7; d++) {
    const day = daysAgo(d);
    await logDose(mEnalapril, carmen, isoDay(day, 8), d === 3 ? 'skipped' : 'taken');
    await logDose(mMetformin, carmen, isoDay(day, 8), 'taken');
    await logDose(mMetformin, carmen, isoDay(day, 20), d === 2 ? 'missed' : 'taken');
    await logDose(mAtorva, carmen, isoDay(day, 21), 'taken');
    await logDose(mDonepezil, carmen, isoDay(day, 21), d === 5 ? 'skipped' : 'taken');
    await logDose(mTio, tomas, isoDay(day, 8), 'taken');
  }

  type Appt = {
    personId: string; title: string; provider: string; location: string;
    kind: string; days: number; status: string; prep: string; notes: string;
  };
  const appts: Appt[] = [
    { personId: carmen, title: 'Cardiology follow-up', provider: 'Dr. Marta Gil', location: 'Hospital Clinic, Valencia', kind: 'specialist', days: 3, status: 'scheduled', prep: 'Bring last labs and blood pressure diary.', notes: '' },
    { personId: carmen, title: 'Blood panel', provider: 'Lab Russafa', location: 'Carrer de Ciril Amoros 12', kind: 'lab', days: 1, status: 'scheduled', prep: 'Fasting from 22:00 the night before.', notes: '' },
    { personId: tomas, title: 'Pulmonology review', provider: 'Dr. Pau Serra', location: 'Hospital de La Princesa, Madrid', kind: 'specialist', days: 10, status: 'scheduled', prep: 'Bring inhaler and peak-flow notes.', notes: '' },
    { personId: carmen, title: 'GP visit', provider: 'Dra. Isabel Ferrer', location: 'Centro de Salud Ruzafa', kind: 'gp', days: -12, status: 'completed', prep: '', notes: 'A1C 7.1. Continue current plan.' },
  ];
  for (const a of appts) {
    const start = new Date(Date.now() + a.days * 86400000);
    start.setHours(10, 30, 0, 0);
    const end = new Date(start.getTime() + 45 * 60000);
    await db.exec(
      `insert into appointments (id,user_id,person_id,title,provider,location,kind,starts_at,ends_at,status,prep_notes,notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [randomUUID(), userId, a.personId, a.title, a.provider, a.location, a.kind, start.toISOString(), end.toISOString(), a.status, a.prep, a.notes],
    );
  }

  type Task = { personId: string | null; title: string; description: string; category: string; days: number; status: string; assigned: string };
  const tasks: Task[] = [
    { personId: carmen, title: 'Refill Metformin at Farmacia Ruzafa', description: 'Only 8 tablets left.', category: 'pharmacy', days: 1, status: 'open', assigned: 'Elena' },
    { personId: carmen, title: 'Collect fasting labs', description: 'Appointment tomorrow morning.', category: 'medical', days: 1, status: 'open', assigned: 'Elena' },
    { personId: tomas, title: 'Replace oxygen concentrator filter', description: 'Monthly. Filters in hall closet.', category: 'home', days: 4, status: 'open', assigned: 'Miguel' },
    { personId: carmen, title: 'Renew dependencia assessment', description: 'Paperwork with social worker.', category: 'paperwork', days: 14, status: 'open', assigned: 'Luis' },
    { personId: tomas, title: 'Book taxi for pulmonology', description: 'Hospital de La Princesa.', category: 'transport', days: 9, status: 'open', assigned: 'Elena' },
    { personId: carmen, title: 'Update medication blister pack', description: 'Sunday evening routine.', category: 'pharmacy', days: -2, status: 'done', assigned: 'Elena' },
  ];
  for (const t of tasks) {
    const due = new Date(Date.now() + t.days * 86400000).toISOString().slice(0, 10);
    await db.exec(
      `insert into tasks (id,user_id,person_id,title,description,category,due_on,status,assigned_to)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [randomUUID(), userId, t.personId, t.title, t.description, t.category, due, t.status, t.assigned],
    );
  }

  type Journal = { personId: string; days: number; mood: string; appetite: string; sleep: string; body: string };
  const journal: Journal[] = [
    { personId: carmen, days: 1, mood: 'ok', appetite: 'ok', sleep: 'restless', body: 'Forgot the evening metformin. Neighbour brought her back from the market at 19:40. Oriented after dinner.' },
    { personId: carmen, days: 2, mood: 'good', appetite: 'good', sleep: 'ok', body: 'Walked to the plaza. Blood pressure 128/78 in the morning. Cheerful on the phone with Luis.' },
    { personId: carmen, days: 4, mood: 'low', appetite: 'low', sleep: 'poor', body: 'Confused about the day. Skipped breakfast. Dra. Ferrer said to watch hydration.' },
    { personId: tomas, days: 1, mood: 'ok', appetite: 'ok', sleep: 'ok', body: 'Short of breath after one flight of stairs. Used rescue inhaler once. No fever.' },
    { personId: tomas, days: 3, mood: 'good', appetite: 'good', sleep: 'ok', body: 'Sat in the courtyard for an hour. Knees better after paracetamol.' },
  ];
  for (const j of journal) {
    const date = new Date(Date.now() - j.days * 86400000).toISOString().slice(0, 10);
    await db.exec(
      `insert into journal_entries (id,user_id,person_id,entry_date,mood,appetite,sleep,body)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [randomUUID(), userId, j.personId, date, j.mood, j.appetite, j.sleep, j.body],
    );
  }

  return true;
}
