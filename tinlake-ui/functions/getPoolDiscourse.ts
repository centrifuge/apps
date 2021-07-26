import { APIGatewayProxyHandler } from 'aws-lambda'
import DOMPurify from 'dompurify'
import fetch from 'node-fetch'

const { DISCOURSE_API_KEY, DISCOURSE_USER_NAME } = process.env

export const handler: APIGatewayProxyHandler = async (event) => {
  const topicLink = event.queryStringParameters?.topic

  if (!DISCOURSE_API_KEY || !DISCOURSE_USER_NAME) {
    return {
      statusCode: 500,
      body: 'One of the required environment variables for the getPoolDiscourse lambda to work is not set',
    }
  }

  if (!topicLink) {
    return {
      statusCode: 500,
      body: 'Parameter missing',
    }
  }

  const data = await fetch(topicLink, { headers: { Accept: 'application/json' } }).then((res) => res.json())
  const {
    id,
    user_id,
    post_stream: { posts: firstPosts, stream: postIds, posts_count },
  } = data

  let posts = firstPosts
  if (posts_count > firstPosts.length) {
  }

  const filteredPosts = posts
    .filter((post: any) => post.user_id === user_id)
    .reverse()
    .slice(0, 3)
    .map((post: any) => ({
      ...post,
      cleanHTML: DOMPurify.sanitize(post.cooked),
    }))

  return {
    statusCode: 200,
    body: JSON.stringify({
      id,
      posts: filteredPosts,
    }),
  }
}
