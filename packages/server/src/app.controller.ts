import { Controller, Get, Render, Request, Response } from '@nestjs/common';
import { AppService } from './app.service';
import config from './config';

@Controller()
export class AppController {

  constructor(
    private readonly appService: AppService,
  ) {
  }

  @Get('')
  @Render('index')
  root(@Request() req, @Response() res) {
    return { preloaderState: this.appService.preloadReduxStore(req.user), ethNetwork: config.ethNetwork };
  }
}
