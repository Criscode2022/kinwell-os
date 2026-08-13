import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MedicationsModule } from '../medications/medications.module';

@Module({
  imports: [MedicationsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
