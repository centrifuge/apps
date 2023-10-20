import { InfuraProvider } from '@ethersproject/providers'
import { isAddress } from '@polkadot/util-crypto'
import { BigNumber, ethers } from 'ethers'
import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import fetch from 'node-fetch'
import { InferType, number, object, string, StringSchema } from 'yup'
import { SupportedNetworks } from '../../database'
import { reportHttpError } from '../../utils/httpError'
import { NetworkSwitch } from '../../utils/networks/networkSwitch'
import { validateInput } from '../../utils/validateInput'

const verifyWalletInput = object({
  signature: string(),
  message: string().when('signature', {
    is: (value) => value !== undefined,
    then: (verifyWalletInput) => verifyWalletInput.required(),
  }),
  address: string().when('signature', {
    is: (value) => value !== undefined,
    then: (verifyWalletInput) =>
      verifyWalletInput.required().test({
        name: 'is-address',
        test(value, ctx) {
          if (isAddress(value)) return true
          return ctx.createError({ message: 'Invalid address', path: ctx.path })
        },
      }),
  }),
  jw3t: string().when('signature', {
    is: undefined,
    then: (verifyWalletInput) => verifyWalletInput.required(),
  }),
  nonce: string().required(),
  network: string().oneOf(['evm', 'substrate', 'evmOnSubstrate']) as StringSchema<SupportedNetworks>,
  chainId: number().required(),
})

const verifySafeInput = object({
  messageHash: string().required(),
  safeAddress: string()
    .required()
    .test({
      name: 'is-address',
      test(value, ctx) {
        if (isAddress(value)) return true
        return ctx.createError({ message: 'Invalid address', path: ctx.path })
      },
    }),
  evmChainId: number().required(),
})

export const authenticateWalletController = async (
  req: Request<{}, {}, InferType<typeof verifyWalletInput | typeof verifySafeInput>>,
  res: Response
) => {
  try {
    let payload

    if ('safeAddress' in req.body) {
      await validateInput(req.body, verifySafeInput)

      const provider = new InfuraProvider(req.body.evmChainId, process.env.INFURA_KEY)
      payload = await verifySafeWallet(provider, req.body.safeAddress, req.body.messageHash, req.body.evmChainId)
    } else {
      await validateInput(req.body, verifyWalletInput)
      payload = await new NetworkSwitch(req.body.network).verifyWallet(req, res)
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h',
      audience: req.get('origin'),
    })
    return res.json({ token })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message, e })
  }
}

const verifySafeWallet = async (provider: any, safeAddress: string, messageHash: string, evmChainId: number) => {
  try {
    const MAGIC_VALUE_BYTES = '0x20c13b0b'

    const safeContract = new ethers.Contract(
      safeAddress,
      [
        'function isValidSignature(bytes calldata _data, bytes calldata _signature) public view returns (bytes4)',
        'function getMessageHash(bytes memory message) public view returns (bytes32)',
        'function getThreshold() public view returns (uint256)',
      ],
      provider
    )

    const safeMessageHash = await safeContract.getMessageHash(messageHash)

    const safeMessage = await fetchSafeMessage(safeMessageHash, evmChainId)

    if (!safeMessage) {
      throw new Error('Unable to fetch SafeMessage')
    }

    const threshold = BigNumber.from(await safeContract.getThreshold()).toNumber()

    if (!threshold || threshold > safeMessage.confirmations.length) {
      throw new Error('Threshold has not been met')
    }

    const response = await safeContract.isValidSignature(messageHash, safeMessage?.preparedSignature)

    if (response === MAGIC_VALUE_BYTES) {
      return {
        address: safeAddress,
        chainId: evmChainId,
        network: 'evm',
      }
    }

    throw new Error('Invalid signature')
  } catch {
    throw new Error('Something went wrong')
  }
}

const TX_SERVICE_URLS: Record<string, string> = {
  '1': 'https://safe-transaction-mainnet.safe.global/api',
  '5': 'https://safe-transaction-goerli.staging.5afe.dev/api',
}

const fetchSafeMessage = async (safeMessageHash: string, chainId: number) => {
  const TX_SERVICE_URL = TX_SERVICE_URLS[chainId.toString()]

  const response = await fetch(`${TX_SERVICE_URL}/v1/messages/${safeMessageHash}/`, {
    headers: { 'Content-Type': 'application/json' },
  })

  return response.json()
}
