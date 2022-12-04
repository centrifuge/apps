import { Keyring } from '@polkadot/keyring'
import { Signer } from '@polkadot/types/types'
import * as jw3t from 'jw3t'

export function getAuthModule() {
  async function generateJw3t(
    address: string,
    signer: Signer,
    options: {
      [key: string]: string
    } = {}
  ) {
    const header = {
      algorithm: 'sr25519',
      token_type: 'JW3T',
      address_type: 'ss58',
    }

    const optionsWithSnakeCasedKeys = Object.keys(options).reduce((acc, key) => {
      const snakeCaseKey = key.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`)
      acc[snakeCaseKey] = options[key]

      return acc
    }, {} as { [key: string]: string })

    const now = Math.floor(Date.now() / 1000)

    const enrichedOptions = {
      // default values
      expires_at: String(now + 60 * 60 * 24 * 30), // 30 days
      not_before: String(now),
      ...optionsWithSnakeCasedKeys,
    }

    const payload = {
      address,
      issued_at: String(now),
      ...enrichedOptions,
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

  return {
    generateJw3t,
  }
}
