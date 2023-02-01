import * as jwt from 'jsonwebtoken'
import { sendEmail } from '.'
import { OnboardingUser } from '../database'

export type VerifyEmailPayload = {
  email: string
  walletAddress: string
}

export const sendVerifyEmailMessage = async (user: OnboardingUser) => {
  if (!user?.email) {
    throw new Error('No email found')
  }
  const payload: VerifyEmailPayload = { email: user.email, walletAddress: user.wallet.address }
  const token = jwt.sign(payload, 'mysecret', {
    expiresIn: '10m',
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
          verifyLink: `http://localhost:8080/verifyEmail?token=${token}`,
        },
      },
    ],
    template_id: 'd-624f08ad697943929064772c0ac2aca1',
    from: {
      name: 'Centrifuge',
      email: `issuer@centrifuge.io`,
    },
  }
  await sendEmail(message)
}
