import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto, LogDoseDto, UpdateMedicationDto } from './medications.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class MedicationsController {
  constructor(private readonly meds: MedicationsService) {}

  @Get('medications')
  list(@CurrentUser() user: AuthUser, @Query('personId') personId?: string) {
    return this.meds.list(user.userId, personId);
  }

  @Post('medications')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMedicationDto) {
    return this.meds.create(user.userId, dto);
  }

  @Patch('medications/:id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateMedicationDto) {
    return this.meds.update(user.userId, id, dto);
  }

  @Delete('medications/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.meds.remove(user.userId, id);
  }

  @Get('doses/today')
  today(@CurrentUser() user: AuthUser, @Query('personId') personId?: string) {
    return this.meds.today(user.userId, personId);
  }

  @Post('doses')
  log(@CurrentUser() user: AuthUser, @Body() dto: LogDoseDto) {
    return this.meds.logDose(user.userId, dto);
  }
}
