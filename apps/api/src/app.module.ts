import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { PeopleModule } from './people/people.module';
import { MedicationsModule } from './medications/medications.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { TasksModule } from './tasks/tasks.module';
import { JournalModule } from './journal/journal.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    PeopleModule,
    MedicationsModule,
    AppointmentsModule,
    TasksModule,
    JournalModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
