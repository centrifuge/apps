import { Keyring } from '@polkadot/keyring'
import { Signer } from '@polkadot/types/types'
import * as jw3t from 'jw3t'

type TokenOptions = {
  [key in 'expiresAt']?: string
}

export function getAuthModule() {
  async function generateJw3t(address: string, signer: Signer, options: TokenOptions = {}) {
    const header = {
      algorithm: 'sr25519',
      token_type: 'JW3T',
      address_type: 'ss58',
    }

    const now = Math.floor(Date.now() / 1000)

    const defaultValues = {
      // default values
      expires_at: options.expiresAt || String(now + 60 * 60 * 24 * 30), // 30 days
      not_before: String(now),
    }

    const payload = {
      address,
      issued_at: String(now),
      ...defaultValues,
    }

    const content = new jw3t.JW3TContent(header, payload)

    const keyring = new Keyring({ type: 'sr25519' })
    const account = keyring.addFromAddress(address)

    const polkaJsSigner = new jw3t.PolkaJsSigner({
      account,
      // @ts-expect-error Signer type version mismatch
      signer,
    })
    const jw3tSigner = new jw3t.JW3TSigner(polkaJsSigner, content)
    const { base64Content, base64Sig } = await jw3tSigner.getSignature()
    const token = `${base64Content}.${base64Sig}`

    return { payload, token }
  }

  async function authenticate(address: string, token: string) {
    try {
      const polkaJsVerifier = new jw3t.PolkaJsVerifier()
      const verifier = new jw3t.JW3TVerifier(polkaJsVerifier)
      const { payload } = await verifier.verify(token)

      const expiry = Number(payload?.expires_at ?? 0) * 1000
      const isExpired = expiry <= Date.now()

      return payload.address === address && !isExpired
    } catch {
      return false
    }
  }

  async function authorizeProxy(proxyTypes: string[], authorizedProxyTypes: string[]) {
    return authorizedProxyTypes.some((authorizedProxyType) => proxyTypes.includes(authorizedProxyType))
  }

  return {
    authenticate,
    authorizeProxy,
    generateJw3t,
  }
}
