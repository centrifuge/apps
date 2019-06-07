import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { AppService } from '../app.service';

@Catch(HttpException, Error)
export class HttpExceptionFilter implements ExceptionFilter {

  constructor(
    private readonly appService: AppService,
  ) {
  }

  /**
   * Handles 404 requests for text/html files and serves the static files for React.
   * Necessary for deep-linking the React routes instead of trying to serve them as Nest routes
   * @param exception: HttpException - exception as thrown by Nest
   * @param host: ArgumentsHost - host and request/response meta information
   */
  catch(exception: HttpException, host: ArgumentsHost, ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    if (exception.getStatus) {
      const status = exception.getStatus();
      if (
        status === 404 &&
        request.headers.accept &&
        request.headers.accept.indexOf('text/html') !== -1
      ) {


        return response.render('index', { preloaderState: this.appService.preloadReduxStore(request.user) });
      }
      return response.status(status).json(exception.getResponse());
    } else {
      console.log("Exception",exception);
      return response.status(500);
    }
  }
}
