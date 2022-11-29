import { Keyring } from '@polkadot/keyring'
import { Signer } from '@polkadot/types/types'
import * as jw3t from 'jw3t'

export function getAuthModule() {
  async function generateJw3t(
    address: string,
    onBehalfOf: string,
    proxyType: 'any' | 'pod_auth' | 'node_admin',
    signer: Signer
  ) {
    const header = {
      algorithm: 'sr25519',
      token_type: 'JW3T',
      address_type: 'ss58',
    }

    const now = Math.floor(Date.now() / 1000)

    const payload = {
      address,
      on_behalf_of: onBehalfOf,
      proxy_type: proxyType,
      expires_at: String(now + 60 * 60 * 24 * 30), // 30 days
      issued_at: String(now),
      not_before: String(now),
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

  async function verifyJw3t(token: string) {
    try {
      const polkaJsVerifier = new jw3t.PolkaJsVerifier()
      const verifier = new jw3t.JW3TVerifier(polkaJsVerifier)

      const { payload } = await verifier.verify(token)

      return payload
    } catch {
      return false
    }
  }
  return {
    generateJw3t,
    verifyJw3t,
  }
}
