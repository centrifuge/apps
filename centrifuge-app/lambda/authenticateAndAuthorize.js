const jw3t = require('jw3t')

const handler = async (event, context) => {
  try {
    const { address, proxy, authorizedProxyTypes } = JSON.parse(event.body)
    if (!address) {
      return { statusCode: 400, body: 'Bad request: address is required' }
    }
    if (proxy && authorizedProxyTypes) {
      const { delegator, types } = proxy
      const token = context.cookies.get(`centrifuge-auth-${address}-${delegator}`)
      if (token) {
        const polkaJsVerifier = new jw3t.PolkaJsVerifier()
        const verifier = new jw3t.JW3TVerifier(polkaJsVerifier)
        const { payload } = await verifier.verify(token)
        if (payload) {
          const isAuthorizedProxy = authorizedProxyTypes.some((proxyType) => types.includes(proxyType))
          return {
            statusCode: 200,
            body: JSON.stringify(isAuthorizedProxy),
          }
        }
      }
      return {
        statusCode: 200,
        body: JSON.stringify(false),
      }
    } else {
      const token = context.cookies.get(`centrifuge-auth-${address}`)
      if (token) {
        const polkaJsVerifier = new jw3t.PolkaJsVerifier()
        const verifier = new jw3t.JW3TVerifier(polkaJsVerifier)
        const { payload } = await verifier.verify(token)
        return payload.address === address
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    }
  }
}

export { handler }
