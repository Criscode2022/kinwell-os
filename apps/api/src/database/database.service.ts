import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PGlite } from '@electric-sql/pglite';
import { Pool, type QueryResultRow } from 'pg';
import { seedIfEmpty } from './seed';

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
      this.logger.log('DATABASE_URL unset - using embedded PGLite');
    }
    await this.migrate();
    const seeded = await seedIfEmpty(this);
    if (seeded) this.logger.log('Seeded demo account demo@kinwell.app / demo1234');
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
}
