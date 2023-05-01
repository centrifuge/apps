import * as sendgridMail from '@sendgrid/mail'
import { HttpError } from '../utils/httpError'

export const templateIds = {
  verifyEmail: 'd-624f08ad697943929064772c0ac2aca1',
  updateInvestorStatus: 'd-42fe587e381345ecb52dd072c299a499',
  investorApproved: 'd-36a4418ce4144d71bfc327e907cf6c49',
  investorRejected: 'd-279cfc9465054ec580f27c043f2744c6',
  manualOnboardedApproved: 'd-696b01394a834ba7b88b791ef97c25f3',
  manualOnboardedPoolApproved: 'd-522e48402bab4976b41f7c7552918444',
  manualOnboardedDeclined: 'd-9439062e51f64c8d93d95f788547299d',
  manualOnboardedPoolDeclined: 'd-9881938c5d3247d6bb32ee2d79f6bebe',
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
    // @ts-expect-error error typing
    throw new HttpError(400, error?.message || 'Unable to send email verification')
  }
}
