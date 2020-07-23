import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { APIGatewayEvent } from 'aws-lambda'
dotenv.config();

import { FormSubmission } from '../components/InvestAction/index'

const {
    SENDGRID_API_KEY,
    SENDGRID_TO_EMAIL,
    SENDGRID_FROM_EMAIL,
} = process.env;

exports.handler = async (event: APIGatewayEvent) => {
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 405,
            body: 'Method not allowed',
        }
    }

    if (event.body === null) {
        return {
            statusCode: 500,
            body: 'You need to pass a JSON object for the form submission',
        }
    }

    const form: FormSubmission = JSON.parse(event.body) as FormSubmission
    const body = `We have received a new investor request for the ${form.poolName} pool.\n\n

    Name: ${form.title} ${form.givenName} ${form.surname}\n
    Email: ${form.email}\n
    Country of Residence: ${form.countryOfResidence}\n
    Type of Investor: ${form.investorType}\n
    Estimated Size of Investment, USD: ${form.investmentSize}\n\n
    `

    console.log(body)

    const msg = {
        to: 'jeroen@centrifuge.io',
        from: 'info@centrifuge.io',
        subject: 'New Investor Request',
        text: body,
    }

    try {
        sgMail.setApiKey(SENDGRID_API_KEY)
        await sgMail.send(msg)

        return {
            statusCode: 200,
            body: 'Success',
        }
    } catch (e) {
        return {
            statusCode: e.code,
            body: e.message,
        }
    }
}
