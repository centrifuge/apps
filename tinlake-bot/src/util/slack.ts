import config from '../config'
import { Pool } from './ipfs'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

// TODO: add typing to blocks
export const pushNotificationToSlack = async (
  pool: Pool,
  title: string,
  blocks: any[],
  externalLink?: NotificationExternalLink
) => {
  const header = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: title,
    },
    ...(externalLink
      ? {
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: externalLink.title,
            },
            value: 'click_me_123',
            url: externalLink.url,
            action_id: 'button-action',
          },
        }
      : {}),
  }

  console.log(`Posting to ${pool.profile?.bot?.channelId || config.defaultSlackChannelId}`)
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${config.slackApiToken}`,
    },
    body: JSON.stringify({
      channel: pool.profile?.bot?.channelId || config.defaultSlackChannelId,
      blocks: [header, ...blocks],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`${response.statusText}: ${body}`)
  }
}

export type NotificationEvent = {
  message: string
  icon?: string
}

export type NotificationExternalLink = {
  url: string
  title: string
}
