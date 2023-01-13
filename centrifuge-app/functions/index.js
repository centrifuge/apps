const routes = [
  {
    name: 'pinFile',
  },
  {
    name: 'unpinFile',
  },
]

const centrifugeDomains = [
  /^(https:\/\/.*cntrfg\.com)/,
  /^(https:\/\/.*centrifuge\.io)/,
  /^(https:\/\/.*altair\.network)/,
  /^(https:\/\/pr-\d*--dev-app-cntrfg.netlify\.app)/,
]

exports.lambdas = async (req, res) => {
  try {
    if (routes.length < 0) {
      return res.status(400).send('No functions defined')
    }

    const origin = req.get('origin')

    const isCentrifugeDomain = centrifugeDomains.some((regex) => regex.test(origin))
    const isLocalhost = /^(http:\/\/localhost:)./.test(origin)
    if (isCentrifugeDomain || isLocalhost) {
      res.set('Access-Control-Allow-Origin', origin)
      res.set('Access-Control-Allow-Methods', ['GET', 'POST'])
    } else {
      return res.status(405).send('Not allowed')
    }

    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET')
      res.set('Access-Control-Allow-Headers', 'Content-Type')
      res.set('Access-Control-Max-Age', '3600')
      return res.status(204).send('')
    }

    for (let route of routes) {
      if (req.path.replace('/lambdas/', '') === route.name) {
        const method = require(`./src/${route.name}`)
        return method(req, res, route?.options ?? {})
      } else {
        throw new Error('No routes')
      }
    }
  } catch (error) {
    console.log('error', error)
    return res.status(500).send('An error occured')
  }
}
