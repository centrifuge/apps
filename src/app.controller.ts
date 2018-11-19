import { Get, Controller, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { API_BASE } from './constants';
import * as path from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(API_BASE)
  apiBase(): string {
    return this.appService.root();
  }

  @Get()
  root(@Res() response): void {
    response.sendFile(path.resolve('./frontend/build/index.html'));
  }
}
