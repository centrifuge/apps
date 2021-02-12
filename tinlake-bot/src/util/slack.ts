import config from '../config'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

// TODO: add typing
export const pushNotificationToSlack = async (
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

  const response = await fetch(config.slackWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
