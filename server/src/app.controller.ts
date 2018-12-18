import { Get, Controller, Res } from '@nestjs/common';
import * as path from 'path';

@Controller()
export class AppController {
  @Get()
  /**
   * Sets up static file serving for the built create-react-app assets
   * @param {Response} response
   */
  root(@Res() response): void {
    response.sendFile(path.resolve('./frontend/build/index.html'));
  }
}