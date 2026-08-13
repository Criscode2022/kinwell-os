import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MedicationsService } from '../medications/medications.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: DatabaseService,
    private readonly meds = new MedicationsService(db),
  ) {}

  async summary(userId: string) {
    const [people, openTasks, upcomingAppts, lowStock] = await Promise.all([
      this.db.queryOne<{ c: string }>(`select count(*)::text as c from people where user_id = $1`, [userId]),
      this.db.queryOne<{ c: string }>(`select count(*)::text as c from tasks where user_id = $1 and status <> 'done'`, [userId]),
      this.db.queryOne<{ c: string }>(`select count(*)::text as c from appointments where user_id = $1 and status = 'scheduled' and starts_at >= now()`, [userId]),
      this.db.queryOne<{ c: string }>(`select count(*)::text as c from medications where user_id = $1 and active and quantity <= 10`, [userId]),
    ]);

    const today = await this.meds.today(userId);
    const dueNow = today.slots.filter((s) => s['status'] === 'due').length;
    const takenToday = today.slots.filter((s) => s['status'] === 'taken').length;

    const nextAppointments = await this.db.query(
      `select a.id, a.title, a.starts_at, a.location, a.kind, p.name as person_name
       from appointments a join people p on p.id = a.person_id
       where a.user_id = $1 and a.status = 'scheduled' and a.starts_at >= now()
       order by a.starts_at asc limit 4`,
      [userId],
    );

    const nextTasks = await this.db.query(
      `select t.id, t.title, t.due_on, t.category, t.status, p.name as person_name
       from tasks t left join people p on p.id = t.person_id
       where t.user_id = $1 and t.status <> 'done'
       order by t.due_on nulls last limit 5`,
      [userId],
    );

    const recentJournal = await this.db.query(
      `select j.id, j.entry_date, j.mood, j.body, p.name as person_name
       from journal_entries j join people p on p.id = j.person_id
       where j.user_id = $1
       order by j.entry_date desc limit 4`,
      [userId],
    );

    return {
      kpis: {
        people: Number(people?.c ?? 0),
        openTasks: Number(openTasks?.c ?? 0),
        upcomingAppointments: Number(upcomingAppts?.c ?? 0),
        lowStock: Number(lowStock?.c ?? 0),
        dueNow,
        takenToday,
        adherence7d: today.adherence7d,
      },
      today: today.slots,
      nextAppointments,
      nextTasks,
      recentJournal,
      dbSource: this.db.source,
    };
  }
}
