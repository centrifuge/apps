import config from '../config'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

export const fetchFromSubgraph = async (query: string) => {
  const res = await fetch(config.tinlakeDataBackendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  return (await res.json()).data
}
