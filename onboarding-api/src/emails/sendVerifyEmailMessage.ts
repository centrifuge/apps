import { Request } from 'express'
import * as jwt from 'jsonwebtoken'
import { sendEmail, templateIds } from '.'
import { OnboardingUser } from '../database'

export type VerifyEmailPayload = {
  email: string
  wallet: Request['wallet']
}

export const sendVerifyEmailMessage = async (user: OnboardingUser, wallet: Request['wallet']) => {
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
