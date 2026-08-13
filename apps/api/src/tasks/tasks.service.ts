import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';

@Injectable()
export class TasksService {
  constructor(private readonly db: DatabaseService) {}

  private map(row: Record<string, unknown>) {
    return {
      id: row.id,
      personId: row.person_id,
      personName: row.person_name ?? null,
      title: row.title,
      description: row.description,
      category: row.category,
      dueOn: row.due_on,
      status: row.status,
      assignedTo: row.assigned_to,
    };
  }

  async list(userId: string, status?: string) {
    const rows = await this.db.query(
      `select t.*, p.name as person_name
       from tasks t left join people p on p.id = t.person_id
       where t.user_id = $1 and ($2::text is null or t.status = $2)
       order by case t.status when 'open' then 0 when 'doing' then 1 else 2 end, t.due_on nulls last`,
      [userId, status || null],
    );
    return rows.map((r) => this.map(r));
  }

  async get(userId: string, id: string) {
    const row = await this.db.queryOne(
      `select t.*, p.name as person_name from tasks t left join people p on p.id = t.person_id where t.id = $1 and t.user_id = $2`,
      [id, userId],
    );
    if (!row) throw new NotFoundException('Task not found');
    return this.map(row);
  }

  async create(userId: string, dto: CreateTaskDto) {
    const id = randomUUID();
    await this.db.exec(
      `insert into tasks (id,user_id,person_id,title,description,category,due_on,status,assigned_to)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, userId, dto.personId || null, dto.title, dto.description ?? '', dto.category ?? 'home', dto.dueOn || null, dto.status ?? 'open', dto.assignedTo ?? ''],
    );
    return this.get(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    await this.get(userId, id);
    await this.db.exec(
      `update tasks set
         title = coalesce($3, title),
         person_id = coalesce($4, person_id),
         description = coalesce($5, description),
         category = coalesce($6, category),
         due_on = coalesce($7, due_on),
         status = coalesce($8, status),
         assigned_to = coalesce($9, assigned_to)
       where id = $1 and user_id = $2`,
      [id, userId, dto.title ?? null, dto.personId ?? null, dto.description ?? null, dto.category ?? null, dto.dueOn ?? null, dto.status ?? null, dto.assignedTo ?? null],
    );
    return this.get(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.db.exec(`delete from tasks where id = $1 and user_id = $2`, [id, userId]);
    return { ok: true };
  }
}
