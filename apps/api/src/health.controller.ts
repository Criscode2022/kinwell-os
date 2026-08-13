import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Controller()
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get('health')
  health() {
    return {
      ok: true,
      service: 'kinwell-api',
      db: this.db.source,
      time: new Date().toISOString(),
    };
  }
}
