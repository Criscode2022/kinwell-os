import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './appointments.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly db: DatabaseService) {}

  private map(row: Record<string, unknown>) {
    return {
      id: row.id,
      personId: row.person_id,
      personName: row.person_name ?? null,
      title: row.title,
      provider: row.provider,
      location: row.location,
      kind: row.kind,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      prepNotes: row.prep_notes,
      notes: row.notes,
    };
  }

  async list(userId: string, status?: string) {
    const rows = await this.db.query(
      `select a.*, p.name as person_name
       from appointments a join people p on p.id = a.person_id
       where a.user_id = $1 and ($2::text is null or a.status = $2)
       order by a.starts_at desc`,
      [userId, status || null],
    );
    return rows.map((r) => this.map(r));
  }

  async get(userId: string, id: string) {
    const row = await this.db.queryOne(
      `select a.*, p.name as person_name from appointments a join people p on p.id = a.person_id where a.id = $1 and a.user_id = $2`,
      [id, userId],
    );
    if (!row) throw new NotFoundException('Appointment not found');
    return this.map(row);
  }

  async create(userId: string, dto: CreateAppointmentDto) {
    const id = randomUUID();
    await this.db.exec(
      `insert into appointments (id,user_id,person_id,title,provider,location,kind,starts_at,ends_at,status,prep_notes,notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [id, userId, dto.personId, dto.title, dto.provider ?? '', dto.location ?? '', dto.kind ?? 'gp', dto.startsAt, dto.endsAt || null, dto.status ?? 'scheduled', dto.prepNotes ?? '', dto.notes ?? ''],
    );
    return this.get(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    await this.get(userId, id);
    await this.db.exec(
      `update appointments set
         title = coalesce($3, title),
         provider = coalesce($4, provider),
         location = coalesce($5, location),
         kind = coalesce($6, kind),
         starts_at = coalesce($7, starts_at),
         ends_at = coalesce($8, ends_at),
         status = coalesce($9, status),
         prep_notes = coalesce($10, prep_notes),
         notes = coalesce($11, notes)
       where id = $1 and user_id = $2`,
      [id, userId, dto.title ?? null, dto.provider ?? null, dto.location ?? null, dto.kind ?? null, dto.startsAt ?? null, dto.endsAt ?? null, dto.status ?? null, dto.prepNotes ?? null, dto.notes ?? null],
    );
    return this.get(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.db.exec(`delete from appointments where id = $1 and user_id = $2`, [id, userId]);
    return { ok: true };
  }
}
