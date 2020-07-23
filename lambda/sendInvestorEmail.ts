import sgMail from '@sendgrid/mail'
import dotenv from 'dotenv'
import { APIGatewayEvent } from 'aws-lambda'
dotenv.config()

import { FormSubmission } from '../components/InvestAction/index'

const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = process.env

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Max-Age': '2592000',
  'Access-Control-Allow-Credentials': 'true',
}

exports.handler = async (event: APIGatewayEvent) => {
  if (!SENDGRID_API_KEY) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: 'The environment variable SENDGRID_API_KEY needs to be set for the sendInvestorEmail lambda to work',
    }
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: 'Method not allowed',
    }
  }

  if (event.body === null) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: 'You need to pass a JSON object for the form submission',
    }
  }

  const form: FormSubmission = JSON.parse(event.body) as FormSubmission
  const body = `We have received a new investor request for the ${form.poolName} pool.

    Name: ${form.title} ${form.givenName} ${form.surname}
    Email: ${form.email}
    Country of Residence: ${form.countryOfResidence}
    
    Type of Investor: ${form.investorType}
    Estimated Size of Investment: ${form.investmentSize}
    Investor Status: ${form.investorConfirmation ? 'Confirmed' : 'Unconfirmed'}`

  const msg = {
    to: form.email,
    from: SENDGRID_FROM_EMAIL,
    subject: `New Investor Request - ${form.poolName}`,
    text: body,
  }

  try {
    sgMail.setApiKey(SENDGRID_API_KEY)
    await sgMail.send(msg)

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: 'Success',
    }
  } catch (e) {
    return {
      statusCode: e.code,
      headers: corsHeaders,
      body: e.message,
    }
  }
}
