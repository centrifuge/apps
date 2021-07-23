import { APIGatewayProxyHandler } from 'aws-lambda'

const { DISCOURSE_API_KEY, DISCOURSE_USER_NAME } = process.env

export const handler: APIGatewayProxyHandler = async (event) => {
  const topicId = event.queryStringParameters?.topic

  if (!DISCOURSE_API_KEY || !DISCOURSE_USER_NAME) {
    return {
      statusCode: 500,
      body: 'One of the required environment variables for the getPoolDiscourse lambda to work is not set',
    }
  }

  if (!topicId) {
    return {
      statusCode: 500,
      body: 'Parameter missing',
    }
  }

  return { statusCode: 200, body: 'test' }
}
