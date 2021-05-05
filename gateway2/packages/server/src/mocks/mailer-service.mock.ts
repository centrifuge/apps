import { ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';

export class MailerServiceMock {
  sendMail = jest.fn(
    async (sendMailOptions: ISendMailOptions): Promise<any> => {
      return true;
    },
  );
}
