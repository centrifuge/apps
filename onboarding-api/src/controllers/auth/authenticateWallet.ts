import { isAddress } from '@polkadot/util-crypto'
import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
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
  network: string().oneOf(['evmOnSafe']).required() as StringSchema<'evmOnSafe'>,
  nonce: string().required(),
})

export const authenticateWalletController = async (
  req: Request<{}, {}, InferType<typeof verifyWalletInput | typeof verifySafeInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, req.body.network === 'evmOnSafe' ? verifySafeInput : verifyWalletInput)

    const payload = await new NetworkSwitch(req.body.network).verifyWallet(req, res)

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
