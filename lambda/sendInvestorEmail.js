import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

const {
    SENDGRID_API_KEY,
    SENDGRID_TO_EMAIL,
    SENDGRID_FROM_EMAIL,
} = process.env;

exports.handler = async (event) => {
    if (event.httpMethod === "GET") {
        return {
            statusCode: 405,
            body: "Method not allowed",
        };
    }

    const msg = {
        to: 'jeroen@centrifuge.io',
        from: 'info@centrifuge.io',
        subject: 'New Investor Request',
        html: body,
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

};
