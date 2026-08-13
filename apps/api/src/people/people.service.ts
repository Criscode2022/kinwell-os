import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { CreateContactDto, CreatePersonDto, UpdatePersonDto } from './people.dto';

@Injectable()
export class PeopleService {
  constructor(private readonly db: DatabaseService) {}

  private map(row: Record<string, unknown>) {
    return {
      id: row.id,
      name: row.name,
      preferredName: row.preferred_name,
      dateOfBirth: row.date_of_birth,
      sex: row.sex,
      relationship: row.relationship,
      conditions: row.conditions,
      allergies: row.allergies,
      bloodType: row.blood_type,
      physician: row.physician,
      physicianPhone: row.physician_phone,
      pharmacy: row.pharmacy,
      pharmacyPhone: row.pharmacy_phone,
      address: row.address,
      city: row.city,
      notes: row.notes,
      color: row.color,
      createdAt: row.created_at,
      medicationCount: row.medication_count != null ? Number(row.medication_count) : undefined,
      openTasks: row.open_tasks != null ? Number(row.open_tasks) : undefined,
    };
  }

  async list(userId: string, q?: string) {
    const rows = await this.db.query(
      `select p.*,
              (select count(*) from medications m where m.person_id = p.id and m.active) as medication_count,
              (select count(*) from tasks t where t.person_id = p.id and t.status <> 'done') as open_tasks
       from people p
       where p.user_id = $1
         and ($2::text is null or p.name ilike '%' || $2 || '%' or p.city ilike '%' || $2 || '%' or p.relationship ilike '%' || $2 || '%')
       order by p.name asc`,
      [userId, q?.trim() || null],
    );
    return rows.map((r) => this.map(r));
  }

  async get(userId: string, id: string) {
    const row = await this.db.queryOne(
      `select p.*,
              (select count(*) from medications m where m.person_id = p.id and m.active) as medication_count,
              (select count(*) from tasks t where t.person_id = p.id and t.status <> 'done') as open_tasks
       from people p where p.id = $1 and p.user_id = $2`,
      [id, userId],
    );
    if (!row) throw new NotFoundException('Person not found');
    const contacts = await this.db.query(
      `select id, name, relationship, phone, is_primary from contacts where person_id = $1 order by is_primary desc, name`,
      [id],
    );
    return {
      ...this.map(row),
      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name,
        relationship: c.relationship,
        phone: c.phone,
        isPrimary: !!c.is_primary,
      })),
    };
  }

  async create(userId: string, dto: CreatePersonDto) {
    const id = randomUUID();
    await this.db.exec(
      `insert into people (id,user_id,name,preferred_name,date_of_birth,sex,relationship,conditions,allergies,blood_type,physician,physician_phone,pharmacy,pharmacy_phone,address,city,notes,color)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        id, userId, dto.name, dto.preferredName ?? '', dto.dateOfBirth || null, dto.sex ?? '',
        dto.relationship ?? '', dto.conditions ?? '', dto.allergies ?? '', dto.bloodType ?? '',
        dto.physician ?? '', dto.physicianPhone ?? '', dto.pharmacy ?? '', dto.pharmacyPhone ?? '',
        dto.address ?? '', dto.city ?? '', dto.notes ?? '', dto.color ?? 'bottle',
      ],
    );
    return this.get(userId, id);
  }

  async update(userId: string, id: string, dto: UpdatePersonDto) {
    await this.get(userId, id);
    await this.db.exec(
      `update people set
         name = coalesce($3, name),
         preferred_name = coalesce($4, preferred_name),
         date_of_birth = coalesce($5, date_of_birth),
         sex = coalesce($6, sex),
         relationship = coalesce($7, relationship),
         conditions = coalesce($8, conditions),
         allergies = coalesce($9, allergies),
         blood_type = coalesce($10, blood_type),
         physician = coalesce($11, physician),
         physician_phone = coalesce($12, physician_phone),
         pharmacy = coalesce($13, pharmacy),
         pharmacy_phone = coalesce($14, pharmacy_phone),
         address = coalesce($15, address),
         city = coalesce($16, city),
         notes = coalesce($17, notes),
         color = coalesce($18, color)
       where id = $1 and user_id = $2`,
      [
        id, userId, dto.name ?? null, dto.preferredName ?? null, dto.dateOfBirth || null,
        dto.sex ?? null, dto.relationship ?? null, dto.conditions ?? null, dto.allergies ?? null,
        dto.bloodType ?? null, dto.physician ?? null, dto.physicianPhone ?? null,
        dto.pharmacy ?? null, dto.pharmacyPhone ?? null, dto.address ?? null, dto.city ?? null,
        dto.notes ?? null, dto.color ?? null,
      ],
    );
    return this.get(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.db.exec(`delete from people where id = $1 and user_id = $2`, [id, userId]);
    return { ok: true };
  }

  async addContact(userId: string, personId: string, dto: CreateContactDto) {
    await this.get(userId, personId);
    const id = randomUUID();
    await this.db.exec(
      `insert into contacts (id,user_id,person_id,name,relationship,phone,is_primary) values ($1,$2,$3,$4,$5,$6,$7)`,
      [id, userId, personId, dto.name, dto.relationship ?? '', dto.phone ?? '', dto.isPrimary ?? false],
    );
    return this.get(userId, personId);
  }

  async removeContact(userId: string, personId: string, contactId: string) {
    await this.get(userId, personId);
    await this.db.exec(`delete from contacts where id = $1 and person_id = $2 and user_id = $3`, [contactId, personId, userId]);
    return { ok: true };
  }

  async emergencyCard(userId: string, id: string) {
    const person = await this.get(userId, id);
    const meds = await this.db.query(
      `select name, dosage, frequency, times, instructions from medications where person_id = $1 and active order by name`,
      [id],
    );
    return { ...person, medications: meds };
  }
}
