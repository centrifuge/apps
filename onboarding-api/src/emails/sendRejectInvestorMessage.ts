import { sendEmail, templateIds } from '.'

export const sendRejectInvestorMessage = async (to: string, metadata: Record<string, any>) => {
  const message = {
    personalizations: [
      {
        to: [
          {
            email: to,
          },
        ],
        dynamic_template_data: {
          poolName: metadata?.pool.name,
          issuerEmail: metadata.pool.issuer.email,
        },
      },
    ],
    template_id: templateIds.investorRejected,
    from: {
      name: 'Centrifuge',
      email: `issuer+${metadata.pool.name?.replaceAll(' ', '')}@centrifuge.io`,
    },
  }
  await sendEmail(message)
}
