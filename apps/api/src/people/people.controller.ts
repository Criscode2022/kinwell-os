import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PeopleService } from './people.service';
import { CreateContactDto, CreatePersonDto, UpdatePersonDto } from './people.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('people')
export class PeopleController {
  constructor(private readonly people: PeopleService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.people.list(user.userId, q);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.people.get(user.userId, id);
  }

  @Get(':id/card')
  card(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.people.emergencyCard(user.userId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePersonDto) {
    return this.people.create(user.userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePersonDto) {
    return this.people.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.people.remove(user.userId, id);
  }

  @Post(':id/contacts')
  addContact(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateContactDto) {
    return this.people.addContact(user.userId, id, dto);
  }

  @Delete(':id/contacts/:contactId')
  removeContact(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('contactId') contactId: string) {
    return this.people.removeContact(user.userId, id, contactId);
  }
}
