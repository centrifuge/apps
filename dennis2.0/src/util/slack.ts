import config from '../config'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

// TODO: add typing
export const pushNotificationToSlack = async (
  title: string,
  events: NotificationEvent[],
  externalLink?: NotificationExternalLink
) => {
  const header = {
    type: 'section',
    text: {
      type: 'plain_text',
      text: title,
      emoji: true,
    },
    ...(externalLink
      ? {
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: externalLink.title,
              emoji: true,
            },
            value: 'click_me_123',
            url: externalLink.url,
            action_id: 'button-action',
          },
        }
      : {}),
  }

  const formattedEvents = events.map((event: NotificationEvent) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${
          event.level === 'error' ? ':no_entry_sign:' : event.level === 'warning' ? ':warning:' : ':information_source:'
        } ${event.message}`,
      },
    }
  })

  await fetch(config.slackWebhookUrl, {
    method: 'POST', // or 'PUT'
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blocks: [header, ...formattedEvents],
    }),
  })
}

export type NotificationEvent = {
  message: string
  level: 'info' | 'warning' | 'error'
}

export type NotificationExternalLink = {
  url: string
  title: string
}
