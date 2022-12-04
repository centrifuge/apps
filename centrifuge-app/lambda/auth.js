const jw3t = require('jw3t')
const cookie = require('cookie')

const handler = async (event) => {
  try {
    const { address, proxy, authorizedProxyTypes } = JSON.parse(event.body)

    if (!address) {
      return { statusCode: 400, body: 'Bad request: address is required' }
    }

    if (!event.headers.cookie) {
      return { statusCode: 401, body: JSON.stringify(false) }
    }

    const cookies = cookie.parse(event.headers.cookie)

    if (proxy && authorizedProxyTypes) {
      const { delegator, types } = proxy
      const token = cookies[`centrifuge-auth-${address}-${delegator}`]

      if (token) {
        const polkaJsVerifier = new jw3t.PolkaJsVerifier()
        const verifier = new jw3t.JW3TVerifier(polkaJsVerifier)
        const { payload } = await verifier.verify(token)

        if (payload) {
          const isAuthorizedProxy = authorizedProxyTypes.some((proxyType) => types.includes(proxyType))

          if (isAuthorizedProxy) {
            return {
              statusCode: 200,
              body: JSON.stringify(true),
            }
          }
        }
      }
    } else {
      const token = cookies[`centrifuge-auth-${address}`]

      if (token) {
        const polkaJsVerifier = new jw3t.PolkaJsVerifier()
        const verifier = new jw3t.JW3TVerifier(polkaJsVerifier)
        const { payload } = await verifier.verify(token)

        if (payload.address === address) {
          return {
            statusCode: 200,
            body: JSON.stringify(true),
          }
        }
      }
    }

    return {
      statusCode: 401,
      body: JSON.stringify(false),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    }
  }
}

export { handler }
