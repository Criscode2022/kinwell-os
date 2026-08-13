import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PGlite } from '@electric-sql/pglite';
import { Pool, type QueryResultRow } from 'pg';
import { randomUUID } from 'crypto';

type QueryResult<T> = { rows: T[]; rowCount: number | null };

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private pglite: PGlite | null = null;
  private mode: 'neon' | 'pglite' = 'pglite';
  public source: 'neon' | 'pglite' = 'pglite';

  async onModuleInit() {
    const url = process.env.DATABASE_URL?.trim();
    if (url) {
      this.pool = new Pool({
        connectionString: url,
        ssl: url.includes('localhost') ? undefined : { rejectUnauthorized: false },
        max: 10,
      });
      this.mode = 'neon';
      this.source = 'neon';
      this.logger.log('Connected to Neon / Postgres via DATABASE_URL');
    } else {
      this.pglite = new PGlite();
      this.mode = 'pglite';
      this.source = 'pglite';
      this.logger.log('DATABASE_URL unset — using embedded PGLite');
    }
    await this.migrate();
    await this.seedIfEmpty();
  }

  async onModuleDestroy() {
    await this.pool?.end();
    await this.pglite?.close();
  }

  private async rawQuery<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    if (this.mode === 'neon' && this.pool) {
      const res = await this.pool.query<T>(text, params);
      return { rows: res.rows, rowCount: res.rowCount };
    }
    const res = await this.pglite!.query(text, params);
    return { rows: (res.rows as T[]) ?? [], rowCount: res.rows?.length ?? 0 };
  }

  async query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
    const res = await this.rawQuery<T>(text, params);
    return res.rows;
  }

  async queryOne<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] ?? null;
  }

  async exec(text: string, params: unknown[] = []): Promise<number> {
    const res = await this.rawQuery(text, params);
    return res.rowCount ?? 0;
  }

  private async migrate() {
    const statements = [
      `create table if not exists users (
        id text primary key,
        email text not null unique,
        password_hash text not null,
        name text not null,
        phone text not null default '',
        timezone text not null default 'Europe/Madrid',
        created_at timestamptz not null default now()
      )`,
      `create table if not exists people (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        name text not null,
        preferred_name text not null default '',
        date_of_birth date,
        sex text not null default '',
        relationship text not null default '',
        conditions text not null default '',
        allergies text not null default '',
        blood_type text not null default '',
        physician text not null default '',
        physician_phone text not null default '',
        pharmacy text not null default '',
        pharmacy_phone text not null default '',
        address text not null default '',
        city text not null default '',
        notes text not null default '',
        color text not null default 'bottle',
        created_at timestamptz not null default now()
      )`,
      `create index if not exists people_user_id_idx on people(user_id)`,
      `create table if not exists contacts (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        person_id text not null references people(id) on delete cascade,
        name text not null,
        relationship text not null default '',
        phone text not null default '',
        is_primary boolean not null default false
      )`,
      `create table if not exists medications (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        person_id text not null references people(id) on delete cascade,
        name text not null,
        generic_name text not null default '',
        dosage text not null default '',
        form text not null default 'tablet',
        frequency text not null default 'daily',
        times text not null default '08:00',
        with_food boolean not null default false,
        instructions text not null default '',
        prescriber text not null default '',
        quantity integer not null default 30,
        refills_left integer not null default 0,
        start_date date,
        active boolean not null default true,
        notes text not null default '',
        created_at timestamptz not null default now()
      )`,
      `create index if not exists medications_person_id_idx on medications(person_id)`,
      `create table if not exists dose_logs (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        medication_id text not null references medications(id) on delete cascade,
        person_id text not null references people(id) on delete cascade,
        scheduled_for timestamptz not null,
        status text not null default 'taken',
        taken_at timestamptz,
        note text not null default '',
        created_at timestamptz not null default now()
      )`,
      `create index if not exists dose_logs_med_idx on dose_logs(medication_id)`,
      `create table if not exists appointments (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        person_id text not null references people(id) on delete cascade,
        title text not null,
        provider text not null default '',
        location text not null default '',
        kind text not null default 'gp',
        starts_at timestamptz not null,
        ends_at timestamptz,
        status text not null default 'scheduled',
        prep_notes text not null default '',
        notes text not null default '',
        created_at timestamptz not null default now()
      )`,
      `create index if not exists appointments_user_id_idx on appointments(user_id)`,
      `create table if not exists tasks (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        person_id text references people(id) on delete set null,
        title text not null,
        description text not null default '',
        category text not null default 'home',
        due_on date,
        status text not null default 'open',
        assigned_to text not null default '',
        created_at timestamptz not null default now()
      )`,
      `create index if not exists tasks_user_id_idx on tasks(user_id)`,
      `create table if not exists journal_entries (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        person_id text not null references people(id) on delete cascade,
        entry_date date not null,
        mood text not null default 'ok',
        appetite text not null default 'ok',
        sleep text not null default 'ok',
        body text not null default '',
        created_at timestamptz not null default now()
      )`,
      `create index if not exists journal_person_idx on journal_entries(person_id)`,
    ];
    for (const sql of statements) await this.exec(sql);
    this.logger.log('Migrations applied');
  }

  private async seedIfEmpty() {
    const existing = await this.queryOne<{ c: string }>(`select count(*)::text as c from users`);
    if (existing && Number(existing.c) > 0) return;

    const bcrypt = await import('bcrypt');
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash('demo1234', 10);
    await this.exec(
      `insert into users (id, email, password_hash, name, phone, timezone)
       values ($1,$2,$3,$4,$5,$6)`,
      [userId, 'demo@kinwell.app', passwordHash, 'Elena Vargas', '+34 612 880 441', 'Europe/Madrid'],
    );

    const carmen = randomUUID();
    const tomas = randomUUID();
    await this.exec(
      `insert into people (id,user_id,name,preferred_name,date_of_birth,sex,relationship,conditions,allergies,blood_type,physician,physician_phone,pharmacy,pharmacy_phone,address,city,notes,color)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        carmen, userId, 'Carmen Ruiz Molina', 'Carmen', '1947-03-12', 'female', 'Mother',
        'Type 2 diabetes; hypertension; early Alzheimer\'s',
        'Penicillin; iodine contrast',
        'A+',
        'Dra. Isabel Ferrer (GP)', '+34 963 220 118',
        'Farmacia Ruzafa', '+34 963 441 902',
        'Carrer de Russafa 41, 3º', 'Valencia',
        'Lives alone. Neighbour has spare key. Prefers morning visits.',
        'bottle',
      ],
    );
    await this.exec(
      `insert into people (id,user_id,name,preferred_name,date_of_birth,sex,relationship,conditions,allergies,blood_type,physician,physician_phone,pharmacy,pharmacy_phone,address,city,notes,color)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        tomas, userId, 'Tomás Vargas León', 'Tomás', '1950-11-04', 'male', 'Father-in-law',
        'COPD; osteoarthritis',
        'Aspirin',
        'O+',
        'Dr. Pau Serra (pulmonology)', '+34 915 667 201',
        'Farmacia Chamberí', '+34 914 220 331',
        'Calle de Fuencarral 88, 2º A', 'Madrid',
        'Uses walker outdoors. Oxygen concentrator at night.',
        'brass',
      ],
    );

    const contacts: [string, string, string, string, boolean][] = [
      [carmen, 'Elena Vargas', 'Daughter / primary', '+34 612 880 441', true],
      [carmen, 'Luis Ruiz', 'Son', '+34 600 119 228', false],
      [carmen, 'Conserje — Edificio Russafa', 'Building', '+34 963 110 044', false],
      [tomas, 'Elena Vargas', 'Daughter-in-law', '+34 612 880 441', true],
      [tomas, 'Miguel Vargas', 'Son', '+34 622 441 090', false],
    ];
    for (const [personId, name, rel, phone, primary] of contacts) {
      await this.exec(
        `insert into contacts (id,user_id,person_id,name,relationship,phone,is_primary) values ($1,$2,$3,$4,$5,$6,$7)`,
        [randomUUID(), userId, personId, name, rel, phone, primary],
      );
    }

    const mEnalapril = randomUUID();
    const mMetformin = randomUUID();
    const mAtorva = randomUUID();
    const mDonepezil = randomUUID();
    const mTio = randomUUID();
    const mPara = randomUUID();
    const meds: [string, string, string, string, string, string, string, string, boolean, string, string, number, number][] = [
      [mEnalapril, carmen, 'Enalapril', 'enalapril', '10 mg', 'tablet', 'daily', '08:00', true, 'With breakfast. Watch for dizziness.', 'Dra. Ferrer', 28, 2],
      [mMetformin, carmen, 'Metformin', 'metformin', '850 mg', 'tablet', 'twice_daily', '08:00,20:00', true, 'With meals. Stop 48h before contrast.', 'Dra. Ferrer', 56, 1],
      [mAtorva, carmen, 'Atorvastatin', 'atorvastatin', '20 mg', 'tablet', 'daily', '21:00', false, 'Evening dose.', 'Dra. Ferrer', 30, 3],
      [mDonepezil, carmen, 'Donepezil', 'donepezil', '5 mg', 'tablet', 'daily', '21:00', false, 'May cause vivid dreams.', 'Dr. Navarro (neuro)', 30, 1],
      [mTio, tomas, 'Tiotropium', 'tiotropium', '18 mcg', 'inhaler', 'daily', '08:00', false, 'One capsule via HandiHaler.', 'Dr. Serra', 30, 2],
      [mPara, tomas, 'Paracetamol', 'paracetamol', '500 mg', 'tablet', 'as_needed', '08:00', false, 'Max 3g/day. For joint pain.', 'Dr. Serra', 20, 0],
    ];
    for (const row of meds) {
      await this.exec(
        `insert into medications (id,user_id,person_id,name,generic_name,dosage,form,frequency,times,with_food,instructions,prescriber,quantity,refills_left,start_date,active)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,current_date - 90,true)`,
        [row[0], userId, row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11], row[12]],
      );
    }

    const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
    const isoDay = (d: Date, hh: number, mm = 0) => {
      const x = new Date(d);
      x.setHours(hh, mm, 0, 0);
      return x.toISOString();
    };
    const logDose = async (medId: string, personId: string, when: string, status: string) => {
      await this.exec(
        `insert into dose_logs (id,user_id,medication_id,person_id,scheduled_for,status,taken_at)
         values ($1,$2,$3,$4,$5,$6,$7)`,
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

    const appts: [string, string, string, string, string, string, number, string, string][] = [
      [carmen, 'Cardiology follow-up', 'Dr. Marta Gil', 'Hospital Clínic, Valencia', 'specialist', 3, 'scheduled', 'Bring last labs and blood pressure diary.', ''],
      [carmen, 'Blood panel', 'Lab Russafa', 'Carrer de Ciril Amorós 12', 'lab', 1, 'scheduled', 'Fasting from 22:00 the night before.', ''],
      [tomas, 'Pulmonology review', 'Dr. Pau Serra', 'Hospital de La Princesa, Madrid', 'specialist', 10, 'scheduled', 'Bring inhaler and peak-flow notes.', ''],
      [carmen, 'GP visit', 'Dra. Isabel Ferrer', 'Centro de Salud Ruzafa', 'gp', -12, 'completed', '', 'A1C 7.1. Continue current plan.'],
    ];
    for (const [personId, title, provider, location, kind, days, status, prep, notes] of appts) {
      const start = new Date(Date.now() + Number(days) * 86400000);
      start.setHours(10, 30, 0, 0);
      const end = new Date(start.getTime() + 45 * 60000);
      await this.exec(
        `insert into appointments (id,user_id,person_id,title,provider,location,kind,starts_at,ends_at,status,prep_notes,notes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [randomUUID(), userId, personId, title, provider, location, kind, start.toISOString(), end.toISOString(), status, prep, notes],
      );
    }

    const tasks: [string | null, string, string, string, number, string, string][] = [
      [carmen, 'Refill Metformin at Farmacia Ruzafa', 'Only 8 tablets left.', 'pharmacy', 1, 'open', 'Elena'],
      [carmen, 'Collect fasting labs', 'Appointment tomorrow morning.', 'medical', 1, 'open', 'Elena'],
      [tomas, 'Replace oxygen concentrator filter', 'Monthly. Filters in hall closet.', 'home', 4, 'open', 'Miguel'],
      [carmen, 'Renew dependencia assessment', 'Paperwork with social worker.', 'paperwork', 14, 'open', 'Luis'],
      [tomas, 'Book taxi for pulmonology', 'Hospital de La Princesa.', 'transport', 9, 'open', 'Elena'],
      [carmen, 'Update medication blister pack', 'Sunday evening routine.', 'pharmacy', -2, 'done', 'Elena'],
    ];
    for (const [personId, title, description, category, days, status, assigned] of tasks) {
      const due = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
      await this.exec(
        `insert into tasks (id,user_id,person_id,title,description,category,due_on,status,assigned_to)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [randomUUID(), userId, personId, title, description, category, due, status, assigned],
      );
    }

    const journal: [string, number, string, string, string, string][] = [
      [carmen, 1, 'ok', 'ok', 'restless', 'Forgot the evening metformin. Neighbour brought her back from the market at 19:40. Oriented after dinner.'],
      [carmen, 2, 'good', 'good', 'ok', 'Walked to the plaza. Blood pressure 128/78 in the morning. Cheerful on the phone with Luis.'],
      [carmen, 4, 'low', 'low', 'poor', 'Confused about the day. Skipped breakfast. Dra. Ferrer said to watch hydration.'],
      [tomas, 1, 'ok', 'ok', 'ok', 'Short of breath after one flight of stairs. Used rescue inhaler once. No fever.'],
      [tomas, 3, 'good', 'good', 'ok', 'Sat in the courtyard for an hour. Knees better after paracetamol.'],
    ];
    for (const [personId, days, mood, appetite, sleep, body] of journal) {
      const date = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      await this.exec(
        `insert into journal_entries (id,user_id,person_id,entry_date,mood,appetite,sleep,body)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [randomUUID(), userId, personId, date, mood, appetite, sleep, body],
      );
    }

    this.logger.log('Seeded demo account demo@kinwell.app / demo1234');
  }
}
