import * as sendgridMail from '@sendgrid/mail'
import { HttpsError } from '../utils/httpsError'

export const templateIds = {
  verifyEmail: 'd-624f08ad697943929064772c0ac2aca1',
}

export const sendEmail = async (message: any) => {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    throw new Error('API key undefined')
  }
  sendgridMail.setApiKey(process.env.SENDGRID_API_KEY)
  try {
    return sendgridMail.send(message)
  } catch (error) {
    console.log('email error', JSON.stringify(error))
    // @ts-ignore
    throw new HttpsError(400, error?.message || 'Unable to send email verification')
  }
}
