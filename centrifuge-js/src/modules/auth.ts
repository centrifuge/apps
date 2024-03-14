import { AddressOrPair } from '@polkadot/api/types'
import { Keyring } from '@polkadot/keyring'
import { Signer } from '@polkadot/types/types'
import * as jw3t from 'jw3t'
import { firstValueFrom, switchMap } from 'rxjs'
import { Centrifuge } from '../Centrifuge'
import { isSameAddress } from '../utils'

type TokenOptions = {
  expiresAt?: string
  onBehalfOf?: string
  notBefore?: string
  proxyType?: string // remove once pod apis dont rely on proxy type in token
}

export function getAuthModule(inst: Centrifuge) {
  async function generateJw3t(address: AddressOrPair, signer?: Signer, options: TokenOptions = {}) {
    const addressString = typeof address === 'object' && 'address' in address ? address.address : address.toString()
    const header = {
      algorithm: 'sr25519',
      token_type: 'JW3T',
      address_type: 'ss58',
    }

    const now = Math.floor(Date.now() / 1000)

    const payload = {
      address: addressString,
      issued_at: String(now),
      expires_at: options.expiresAt || String(now + 60 * 60 * 24 * 30), // 30 days
      on_behalf_of: options.onBehalfOf,
      not_before: options.notBefore || String(now),
      proxy_type: options.proxyType, // remove once pod apis dont rely on proxy type in token
    }

    const content = new jw3t.JW3TContent(header, payload)

    let account
    if (typeof address === 'object' && 'sign' in address) {
      account = address
    } else {
      const keyring = new Keyring({ type: 'sr25519' })
      account = keyring.addFromAddress(addressString)
    }

    const polkaJsSigner = new jw3t.PolkaJsSigner({
      // @ts-ignore KeyPair type mismatch
      account,
      // @ts-ignore Signer type mismatch
      signer,
    })
    const jw3tSigner = new jw3t.JW3TSigner(polkaJsSigner, content)
    const { base64Content, base64Sig } = await jw3tSigner.getSignature()
    const token = `${base64Content}.${base64Sig}`

    return { payload, token }
  }

  async function verify(token: string) {
    try {
      const polkaJsVerifier = new jw3t.PolkaJsVerifier()
      const verifier = new jw3t.JW3TVerifier(polkaJsVerifier)
      const { payload } = (await verifier.verify(token)) as any

      return {
        verified: true,
        payload,
      }
    } catch {
      return {
        verified: false,
      }
    }
  }

  async function verifyProxy(address: string, delegator: string, authorizedProxyTypes: string[]) {
    const proxiesData = await firstValueFrom(inst.getApi().pipe(switchMap((api) => api.query.proxy.proxies(delegator))))
    const [proxies] = proxiesData.toJSON() as [{ delegate: string; proxyType: string }[]]

    const addressProxies = proxies.filter((proxy) => isSameAddress(proxy.delegate, address))
    const proxyTypes = addressProxies.map((proxy) => proxy.proxyType)

    if (proxyTypes) {
      return {
        verified: authorizedProxyTypes.some((authorizedProxyType) => proxyTypes.includes(authorizedProxyType)),
        proxyTypes,
      }
    }

    return { verified: false }
  }

  return {
    verify,
    verifyProxy,
    generateJw3t,
  }
}
