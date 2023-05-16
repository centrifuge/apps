import * as jwt from 'jsonwebtoken'
import { sendEmail, templateIds } from '.'
import { OnboardingUser, Wallet } from '../database'

export type VerifyEmailPayload = {
  email: string
  wallet: Wallet[0]
}

export const sendVerifyEmailMessage = async (user: OnboardingUser, wallet: Wallet[0]) => {
  if (!user?.email) {
    throw new Error('No email found')
  }
  const payload: VerifyEmailPayload = { email: user.email, wallet }
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m',
  })

  const message = {
    personalizations: [
      {
        to: [
          {
            email: user.email,
          },
        ],
        dynamic_template_data: {
          verifyLink: `${process.env.REDIRECT_URL}/onboarding/verifyEmail?token=${encodeURIComponent(token)}`,
          disclaimerLink: `${process.env.REDIRECT_URL}/disclaimer`,
        },
      },
    ],
    template_id: templateIds.verifyEmail,
    from: {
      name: 'Centrifuge',
      email: 'hello@centrifuge.io',
    },
  }
  await sendEmail(message)
}
