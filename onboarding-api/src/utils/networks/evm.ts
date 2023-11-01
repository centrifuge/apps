import { isAddress } from '@ethersproject/address'
import { Contract } from '@ethersproject/contracts'
import { InfuraProvider, JsonRpcProvider, Provider } from '@ethersproject/providers'
import { BigNumber, ethers } from 'ethers'
import { Request, Response } from 'express'
import fetch from 'node-fetch'
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

export const verifySafeWallet = async (req: Request, res: Response) => {
  const { safeAddress, messageHash, evmChainId, nonce } = req.body
  const MAGIC_VALUE_BYTES = '0x20c13b0b'

  if (!isAddress(safeAddress)) {
    throw new HttpError(400, 'Invalid address')
  }

  const cookieNonce = req.signedCookies[`onboarding-auth-${safeAddress.toLowerCase()}`]

  if (!cookieNonce || cookieNonce !== nonce) {
    throw new HttpError(400, 'Invalid nonce')
  }

  const provider = new InfuraProvider(req.body.evmChainId, process.env.INFURA_KEY)
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
    throw new HttpError(400, 'Unable to fetch SafeMessage')
  }

  const threshold = BigNumber.from(await safeContract.getThreshold()).toNumber()

  if (!threshold || threshold > safeMessage.confirmations.length) {
    throw new HttpError(400, 'Threshold has not been met')
  }

  const response = await safeContract.isValidSignature(messageHash, safeMessage?.preparedSignature)
  res.clearCookie(`onboarding-auth-${safeAddress.toLowerCase()}`)

  if (response === MAGIC_VALUE_BYTES) {
    return {
      address: safeAddress,
      chainId: evmChainId,
      network: 'evm',
    }
  }

  throw new HttpError(400, 'Invalid signature')
}

const TX_SERVICE_URLS: Record<string, string> = {
  '1': 'https://safe-transaction-mainnet.safe.global/api',
  '5': 'https://safe-transaction-goerli.safe.global/api',
}

const fetchSafeMessage = async (safeMessageHash: string, chainId: number) => {
  const TX_SERVICE_URL = TX_SERVICE_URLS[chainId.toString()]

  const response = await fetch(`${TX_SERVICE_URL}/v1/messages/${safeMessageHash}/`, {
    headers: { 'Content-Type': 'application/json' },
  })

  return response.json()
}
