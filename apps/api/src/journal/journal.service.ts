import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { CreateJournalDto, UpdateJournalDto } from './journal.dto';

@Injectable()
export class JournalService {
  constructor(private readonly db: DatabaseService) {}

  private map(row: Record<string, unknown>) {
    return {
      id: row.id,
      personId: row.person_id,
      personName: row.person_name ?? null,
      entryDate: row.entry_date,
      mood: row.mood,
      appetite: row.appetite,
      sleep: row.sleep,
      body: row.body,
      createdAt: row.created_at,
    };
  }

  async list(userId: string, personId?: string) {
    const rows = await this.db.query(
      `select j.*, p.name as person_name
       from journal_entries j join people p on p.id = j.person_id
       where j.user_id = $1 and ($2::text is null or j.person_id = $2)
       order by j.entry_date desc, j.created_at desc`,
      [userId, personId || null],
    );
    return rows.map((r) => this.map(r));
  }

  async get(userId: string, id: string) {
    const row = await this.db.queryOne(
      `select j.*, p.name as person_name from journal_entries j join people p on p.id = j.person_id where j.id = $1 and j.user_id = $2`,
      [id, userId],
    );
    if (!row) throw new NotFoundException('Entry not found');
    return this.map(row);
  }

  async create(userId: string, dto: CreateJournalDto) {
    const id = randomUUID();
    const date = dto.entryDate || new Date().toISOString().slice(0, 10);
    await this.db.exec(
      `insert into journal_entries (id,user_id,person_id,entry_date,mood,appetite,sleep,body)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, userId, dto.personId, date, dto.mood ?? 'ok', dto.appetite ?? 'ok', dto.sleep ?? 'ok', dto.body ?? ''],
    );
    return this.get(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateJournalDto) {
    await this.get(userId, id);
    await this.db.exec(
      `update journal_entries set
         mood = coalesce($3, mood),
         appetite = coalesce($4, appetite),
         sleep = coalesce($5, sleep),
         body = coalesce($6, body)
       where id = $1 and user_id = $2`,
      [id, userId, dto.mood ?? null, dto.appetite ?? null, dto.sleep ?? null, dto.body ?? null],
    );
    return this.get(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.db.exec(`delete from journal_entries where id = $1 and user_id = $2`, [id, userId]);
    return { ok: true };
  }
}
