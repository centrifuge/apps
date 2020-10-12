export {}
// import sgMail from '@sendgrid/mail'
// import dotenv from 'dotenv'
// import { APIGatewayEvent } from 'aws-lambda'
// dotenv.config()

// import { FormSubmission } from '../components/InvestAction/index'

// const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, INVESTOR_REQUEST_EMAIL } = process.env

// exports.handler = async (event: APIGatewayEvent) => {
//   if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL || !INVESTOR_REQUEST_EMAIL) {
//     return {
//       statusCode: 500,
//       body: 'One of the required environment variables for the sendInvestorEmail lambda to work is not set',
//     }
//   }

//   if (event.httpMethod === 'GET') {
//     return {
//       statusCode: 405,
//       body: 'Method not allowed',
//     }
//   }

//   if (event.body === null) {
//     return {
//       statusCode: 500,
//       body: 'You need to pass a JSON object for the form submission',
//     }
//   }

//   const form: FormSubmission = JSON.parse(event.body) as FormSubmission
//   const body = `We have received a new investor request for the ${form.poolName} pool.

//     Name: ${form.title} ${form.givenName} ${form.surname}
//     Email: ${form.email}
//     Country of Residence: ${form.countryOfResidence}

//     Type of Investor: ${form.investorType}
//     Estimated Size of Investment: ${form.investmentSize}
//     Investor Status: ${form.investorConfirmation ? 'Confirmed' : 'Unconfirmed'}`

//   const msg = {
//     to: INVESTOR_REQUEST_EMAIL,
//     from: SENDGRID_FROM_EMAIL,
//     subject: `New Investor Request - ${form.poolName}`,
//     text: body,
//   }

//   try {
//     sgMail.setApiKey(SENDGRID_API_KEY)
//     await sgMail.send(msg)

//     return {
//       statusCode: 200,
//       body: 'Success',
//     }
//   } catch (e) {
//     return {
//       statusCode: e.code,
//       body: e.message,
//     }
//   }
// }
