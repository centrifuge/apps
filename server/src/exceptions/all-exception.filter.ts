import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { AppService } from '../app.service';
import config from '../../../src/common/config';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {

  constructor(
    private readonly appService: AppService,
  ) {
  }

  /**
   * Handles all exceptions thrown inside the application
   * @param exception: any - exception as thrown by Nest
   * @param host: ArgumentsHost - host and request/response meta information
   */
  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    // Check if it is a HttpException
    if (exception.getStatus) {
      const status = exception.getStatus();
      /* Handles 404 requests for text/html files and serves the static files for React.
       * Necessary for deep-linking the React routes instead of trying to serve them as Nest routes
       * */
      if (
        status === 404 &&
        request.headers.accept &&
        request.headers.accept.indexOf('text/html') !== -1
      ) {
        return response.render('index', {
          preloaderState: this.appService.preloadReduxStore(request.user),
          ethNetwork: config.ethNetwork,
        });
      }
      return response.status(status).json(exception.getResponse());
    } else {
      if (exception.constructor.name === 'FetchError') {
        // Catch fetch errors from the centrifuge client. Ex: Network errors
        return response.status(HttpStatus.BAD_REQUEST).json(exception.message);
      } else if (exception.constructor.name === 'Body') {
        // Catch node api errors. It can return text and json
        let message;
        if (exception.headers.get('content-type').match('application/json')) {
          message = (await exception.json()).message;
        } else {
          message = await exception.text();
        }
        return response.status(exception.status).json({
          statusCode: exception.status,
          message,
        });
      } else {
        // All unhandled errors
        console.log(exception);
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Unhandled Exception',
        });
      }
    }
  }
}
