import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison */

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Default message (Polite Egyptian Arabic)
    let message = 'حصلت مشكلة بسيطة في السيرفر، جرب تاني كمان شوية';

    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse() as
        | string
        | { message: string | string[] };
      const exceptionMessage =
        typeof responseBody === 'string' ? responseBody : responseBody.message;
      const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

      switch (status) {
        case HttpStatus.UNAUTHORIZED: {
          const msg =
            typeof exceptionMessage === 'string' ? exceptionMessage : '';
          message = isArabic(msg)
            ? msg
            : 'عفواً، لازم تسجل دخول الأول عشان تقدر تكمل';
          break;
        }
        case HttpStatus.FORBIDDEN: {
          const msg =
            typeof exceptionMessage === 'string' ? exceptionMessage : '';
          message = isArabic(msg) ? msg : 'عفواً، مفيش صلاحية للدخول هنا';
          break;
        }
        case HttpStatus.NOT_FOUND: {
          const msg =
            typeof exceptionMessage === 'string' ? exceptionMessage : '';
          message = isArabic(msg)
            ? msg
            : 'عفواً، الحاجة اللي بتدور عليها مش موجودة حالياً';
          break;
        }
        case HttpStatus.BAD_REQUEST: {
          const msg =
            typeof exceptionMessage === 'string' ? exceptionMessage : '';
          if (isArabic(msg)) {
            message = msg;
          } else if (
            typeof responseBody === 'object' &&
            responseBody.message &&
            Array.isArray(responseBody.message)
          ) {
            message = `فيه مشكلة في البيانات: ${responseBody.message.join(' - ')}`;
          } else {
            message = 'فيه مشكلة في البيانات اللي مبعوتة، يا ريت تراجعها تاني';
          }
          break;
        }
        case HttpStatus.TOO_MANY_REQUESTS: {
          const msg =
            typeof exceptionMessage === 'string' ? exceptionMessage : '';
          message = isArabic(msg)
            ? msg
            : 'عملت طلبات كتير في وقت قصير، يا ريت تستنى دقيقة وتجرب تاني';
          break;
        }
        default: {
          const msg =
            typeof exceptionMessage === 'string' ? exceptionMessage : '';
          message = isArabic(msg) ? msg : message;
        }
      }
    } else {
      // Log non-http exceptions for debugging
      console.error('Non-HTTP Exception:', String(exception));
    }

    const requestUrl =
      typeof request.url === 'string' ? request.url : 'unknown';
    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: requestUrl,
      message: message,
    });
  }
}
