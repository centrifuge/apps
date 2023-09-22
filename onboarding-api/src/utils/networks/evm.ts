import { isAddress } from '@ethersproject/address'
import { Contract } from '@ethersproject/contracts'
import { InfuraProvider, JsonRpcProvider, Provider } from '@ethersproject/providers'
import { Request, Response } from 'express'
import { SiweMessage } from 'siwe'
import { InferType } from 'yup'
import { signAndSendDocumentsInput } from '../../controllers/emails/signAndSendDocuments'
import { HttpError } from '../httpError'
import RemarkerAbi from './abi/Remarker.abi.json'

const getEvmProvider = (chainId: number, isEvmOnCentChain?: boolean): Provider => {
  if (isEvmOnCentChain) {
    return new InfuraProvider(chainId, process.env.INFURA_KEY)
  }
  switch (chainId) {
    case 1: // eth mainnet
    case 5: // goerli
      return new InfuraProvider(chainId, process.env.INFURA_KEY)
    case 8453: // base mainnet
      return new JsonRpcProvider('https://mainnet.base.org')
    case 84531: // base goerli
      return new JsonRpcProvider('https://goerli.base.org')
    default:
      throw new HttpError(404, `Unsupported chainId ${chainId}`)
  }
}

export const validateEvmRemark = async (
  wallet: Request['wallet'],
  transactionInfo: InferType<typeof signAndSendDocumentsInput>['transactionInfo'],
  expectedRemark: string
) => {
  const provider = getEvmProvider(transactionInfo.chainId, transactionInfo?.isEvmOnSubstrate)
  const remarkerAddress = '0x3E39db43035981c2C31F7Ffa4392f25231bE4477'
  const contract = new Contract(remarkerAddress, RemarkerAbi).connect(provider)
  const filteredEvents = await contract.queryFilter(
    'Remarked',
    Number(transactionInfo.blockNumber),
    Number(transactionInfo.blockNumber)
  )

  const [sender, actualRemark] = filteredEvents.flatMap((ev) => ev.args?.map((arg) => arg.toString()))
  if (actualRemark !== expectedRemark || sender !== wallet.address) {
    throw new HttpError(400, 'Invalid remark')
  }
}

export async function verifyEvmWallet(req: Request, res: Response): Promise<Request['wallet']> {
  const { message, signature, address, nonce, network, chainId } = req.body

  if (!isAddress(address)) {
    throw new HttpError(400, 'Invalid address')
  }

  const cookieNonce = req.signedCookies[`onboarding-auth-${address.toLowerCase()}`]

  if (!cookieNonce || cookieNonce !== nonce) {
    throw new HttpError(400, 'Invalid nonce')
  }

  const decodedMessage = await new SiweMessage(message).verify({ signature })
  res.clearCookie(`onboarding-auth-${address.toLowerCase()}`)
  return {
    address: decodedMessage.data.address,
    network,
    chainId,
  }
}
