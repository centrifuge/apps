export class EmailService {
  async sendEmail(mailTo, templates) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      body: JSON.stringify({
        from: {
          name: 'Tinlake pools',
          email: 'issuer@tinlake.com',
        },
        personalizations: [
          {
            to: [mailTo],
            dynamic_template_data: {
              investorName: 'Jane',
              poolName: 'New Silver 2',
              token: 'DROP',
              issuerName: 'NS Pool LLC',
              issuerEmail: 'kirill@newsilver.com',
            },
          },
        ],
        template_id: '',
      }),
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
  }
}
