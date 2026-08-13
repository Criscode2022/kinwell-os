import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { CreateMedicationDto, LogDoseDto, UpdateMedicationDto } from './medications.dto';

@Injectable()
export class MedicationsService {
  constructor(private readonly db: DatabaseService) {}

  private map(row: Record<string, unknown>) {
    return {
      id: row.id,
      personId: row.person_id,
      personName: row.person_name ?? null,
      name: row.name,
      genericName: row.generic_name,
      dosage: row.dosage,
      form: row.form,
      frequency: row.frequency,
      times: row.times,
      withFood: !!row.with_food,
      instructions: row.instructions,
      prescriber: row.prescriber,
      quantity: Number(row.quantity ?? 0),
      refillsLeft: Number(row.refills_left ?? 0),
      startDate: row.start_date,
      active: !!row.active,
      notes: row.notes,
    };
  }

  async list(userId: string, personId?: string) {
    const rows = await this.db.query(
      `select m.*, p.name as person_name
       from medications m
       join people p on p.id = m.person_id
       where m.user_id = $1 and ($2::text is null or m.person_id = $2)
       order by m.active desc, p.name, m.name`,
      [userId, personId || null],
    );
    return rows.map((r) => this.map(r));
  }

  async get(userId: string, id: string) {
    const row = await this.db.queryOne(
      `select m.*, p.name as person_name from medications m join people p on p.id = m.person_id where m.id = $1 and m.user_id = $2`,
      [id, userId],
    );
    if (!row) throw new NotFoundException('Medication not found');
    return this.map(row);
  }

  async create(userId: string, dto: CreateMedicationDto) {
    const id = randomUUID();
    await this.db.exec(
      `insert into medications (id,user_id,person_id,name,generic_name,dosage,form,frequency,times,with_food,instructions,prescriber,quantity,refills_left,start_date,active,notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        id, userId, dto.personId, dto.name, dto.genericName ?? '', dto.dosage ?? '',
        dto.form ?? 'tablet', dto.frequency ?? 'daily', dto.times ?? '08:00',
        dto.withFood ?? false, dto.instructions ?? '', dto.prescriber ?? '',
        dto.quantity ?? 30, dto.refillsLeft ?? 0, dto.startDate || null,
        dto.active ?? true, dto.notes ?? '',
      ],
    );
    return this.get(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateMedicationDto) {
    await this.get(userId, id);
    await this.db.exec(
      `update medications set
         name = coalesce($3, name),
         generic_name = coalesce($4, generic_name),
         dosage = coalesce($5, dosage),
         form = coalesce($6, form),
         frequency = coalesce($7, frequency),
         times = coalesce($8, times),
         with_food = coalesce($9, with_food),
         instructions = coalesce($10, instructions),
         prescriber = coalesce($11, prescriber),
         quantity = coalesce($12, quantity),
         refills_left = coalesce($13, refills_left),
         active = coalesce($14, active),
         notes = coalesce($15, notes)
       where id = $1 and user_id = $2`,
      [
        id, userId, dto.name ?? null, dto.genericName ?? null, dto.dosage ?? null, dto.form ?? null,
        dto.frequency ?? null, dto.times ?? null, dto.withFood ?? null, dto.instructions ?? null,
        dto.prescriber ?? null, dto.quantity ?? null, dto.refillsLeft ?? null, dto.active ?? null, dto.notes ?? null,
      ],
    );
    return this.get(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.db.exec(`delete from medications where id = $1 and user_id = $2`, [id, userId]);
    return { ok: true };
  }

  private parseTimes(times: string, frequency: string): string[] {
    const parsed = (times || '')
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (parsed.length) return parsed;
    if (frequency === 'twice_daily') return ['08:00', '20:00'];
    if (frequency === 'three_daily') return ['08:00', '14:00', '20:00'];
    return ['08:00'];
  }

  async today(userId: string, personId?: string) {
    const meds = await this.db.query(
      `select m.*, p.name as person_name
       from medications m join people p on p.id = m.person_id
       where m.user_id = $1 and m.active = true and m.frequency <> 'as_needed'
         and ($2::text is null or m.person_id = $2)`,
      [userId, personId || null],
    );
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const logs = await this.db.query(
      `select * from dose_logs where user_id = $1 and scheduled_for >= $2 and scheduled_for <= $3`,
      [userId, start.toISOString(), end.toISOString()],
    );

    const slots: Record<string, unknown>[] = [];
    for (const med of meds) {
      for (const hhmm of this.parseTimes(String(med.times), String(med.frequency))) {
        const [h, m] = hhmm.split(':').map(Number);
        const scheduled = new Date();
        scheduled.setHours(h || 8, m || 0, 0, 0);
        const log = logs.find(
          (l) => l.medication_id === med.id && Math.abs(new Date(String(l.scheduled_for)).getTime() - scheduled.getTime()) < 30 * 60 * 1000,
        );
        slots.push({
          medicationId: med.id,
          personId: med.person_id,
          personName: med.person_name,
          name: med.name,
          dosage: med.dosage,
          form: med.form,
          withFood: !!med.with_food,
          instructions: med.instructions,
          scheduledFor: scheduled.toISOString(),
          time: hhmm,
          status: log ? log.status : scheduled.getTime() < Date.now() - 45 * 60 * 1000 ? 'due' : 'upcoming',
          logId: log?.id ?? null,
        });
      }
    }
    slots.sort((a, b) => String(a['time']).localeCompare(String(b['time'])));

    const week = await this.db.queryOne<{ taken: string; total: string }>(
      `select
         count(*) filter (where status = 'taken')::text as taken,
         count(*)::text as total
       from dose_logs
       where user_id = $1 and scheduled_for >= current_date - 7`,
      [userId],
    );
    const taken = Number(week?.taken ?? 0);
    const total = Number(week?.total ?? 0);
    return {
      slots,
      adherence7d: total === 0 ? 100 : Math.round((taken / total) * 100),
      taken7d: taken,
      total7d: total,
    };
  }

  async logDose(userId: string, dto: LogDoseDto) {
    const med = await this.get(userId, dto.medicationId);
    const scheduledFor = dto.scheduledFor || new Date().toISOString();
    const id = randomUUID();
    await this.db.exec(
      `insert into dose_logs (id,user_id,medication_id,person_id,scheduled_for,status,taken_at,note)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, userId, dto.medicationId, med.personId, scheduledFor, dto.status, dto.status === 'taken' ? new Date().toISOString() : null, dto.note ?? ''],
    );
    return { id, ...dto, personId: med.personId };
  }
}
