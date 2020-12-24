import { ITinlake, Loan, NFT, PendingTransaction } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { EpochData } from '../../ducks/pool'
import { maxUint256 } from '../../utils/maxUint256'
import { getAddressMemory, setAddressMemory } from './address-memory'

export type TrancheType = 'junior' | 'senior'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export interface TinlakeResult {
  data?: any
  errorMsg?: string
  tokenId?: string
  loanId?: string
}

// TinlakeAction args need to be serializable, as they are stored in Redux state for the async transactions duck
// Based on: https://github.com/microsoft/TypeScript/issues/1897#issuecomment-657294463
type SerializableScalar = string & number & boolean
type SerializableObject = { [key: string]: SerializableScalar & SerializableObject & SerializableArray }
type SerializableArray = (SerializableScalar & SerializableObject & SerializableArray)[]
type Serializable = SerializableScalar & SerializableObject & SerializableArray

export type TinlakeAction = (tinlake: ITinlake, ...args: Serializable[]) => Promise<PendingTransaction>

export async function getNFT(registry: string, tinlake: ITinlake, tokenId: string) {
  let nftOwner: string
  let nftData: any
  let maturityDate: number = 0

  try {
    nftOwner = (await tinlake.getOwnerOfCollateral(registry, tokenId)).toString()
  } catch (e) {
    return loggedError(e, 'Could not get NFT owner for NFT ID', tokenId)
  }

  if (!nftOwner) {
    return loggedError({}, 'Could not get NFT owner for NFT ID', tokenId)
  }

  try {
    nftData = await tinlake.getNFTData(registry, tokenId)
  } catch (e) {
    nftData = null
  }
  const replacedTokenId = tokenId.replace(/^0x/, '')
  const bnTokenId = new BN(replacedTokenId)

  try {
    const nftId = await (tinlake as ITinlake).getNftFeedId(registry, tokenId)
    maturityDate = (await (tinlake as ITinlake).getNftMaturityDate(nftId)).toNumber()
  } catch (e) {
    console.error(e)
  }

  const nft: NFT = {
    nftOwner,
    nftData,
    registry,
    maturityDate,
    tokenId: bnTokenId,
  }

  return {
    nft,
    tokenId,
  }
}

async function getOrCreateProxy(tinlake: ITinlake, address: string) {
  let proxyAddress
  // check if user already has a proxy address
  try {
    proxyAddress = await tinlake.checkProxyExists(address)
  } catch (e) {
    proxyAddress = null
  }

  // create new proxy address in case user did not have one
  if (!proxyAddress) {
    try {
      proxyAddress = await tinlake.proxyCreateNew(address)
    } catch (e) {
      throw e
    }
  }
  return proxyAddress
}

export const mintNFT = async (
  tinlake: ITinlake,
  nftAddr: string,
  owner: string,
  tokenId: string,
  ref: string,
  amount: string,
  asset: string
): Promise<PendingTransaction> => {
  return tinlake.mintNFT(nftAddr, owner, tokenId, ref, amount, asset)
}

export const updateNftFeed = async (
  tinlake: ITinlake,
  nftFeedId: string,
  value: string,
  riskGroup: string
): Promise<PendingTransaction> => {
  return tinlake.updateNftFeed(nftFeedId, value, riskGroup)
}

export const setMaturityDate = async (
  tinlake: ITinlake,
  nftFeedId: string,
  timestampSecs: number
): Promise<PendingTransaction> => {
  return tinlake.setMaturityDate(nftFeedId, timestampSecs)
}

export const issue = async (
  tinlake: ITinlake,
  tokenId: string,
  nftRegistryAddress: string
): Promise<PendingTransaction> => {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const user = await tinlake.signer.getAddress()!
  let tokenOwner

  try {
    tokenOwner = await tinlake.getNFTOwner(nftRegistryAddress, tokenId)
  } catch (e) {
    return loggedError(e, 'Could not retrieve nft owner.', tokenId)
  }

  // case: borrower is owner of nft
  if (user.toLowerCase() === tokenOwner.toString().toLowerCase()) {
    // get or create new proxy
    let proxyAddress
    try {
      proxyAddress = await getOrCreateProxy(tinlake, user)
    } catch (e) {
      return loggedError(e, 'Could not retrieve proxyAddress.', user)
    }

    // approve proxy to take nft if not yet happened
    if (!(await tinlake.isNFTApprovedForAll(nftRegistryAddress, user, proxyAddress))) {
      try {
        const approveTx = await tinlake.setNFTApprovalForAll(nftRegistryAddress, proxyAddress, true)
        await tinlake.getTransactionReceipt(approveTx as any)
      } catch (e) {
        return loggedError(e, 'Could not approve proxy to take NFT.', tokenId)
      }
    }

    // transfer issue
    return tinlake.proxyTransferIssue(proxyAddress, nftRegistryAddress, tokenId)
  }

  let proxyOwner
  try {
    proxyOwner = (await tinlake.getProxyOwnerByAddress(tokenOwner.toString())).toString()
  } catch (e) {
    proxyOwner = ZERO_ADDRESS
  }

  // case: borrower's proxy is owner of nft
  if (user.toLowerCase() === proxyOwner.toLowerCase()) {
    return tinlake.proxyIssue(tokenOwner.toString(), nftRegistryAddress, tokenId)
  }

  // case: nft can not be used to open a loan -> borrower/borrower's proxy not nft owner

  return loggedError({}, 'Borrower is not nft owner.', tokenId)
}

export async function getProxyOwner(tinlake: ITinlake, loanId: string): Promise<TinlakeResult> {
  let owner = ZERO_ADDRESS
  try {
    owner = (await tinlake.getProxyOwnerByLoan(loanId)).toString()
  } catch (e) {}
  return { data: owner }
}

export async function getLoan(tinlake: ITinlake, loanId: string): Promise<Loan | null> {
  let loan
  const count = await tinlake.loanCount()

  if (count.toNumber() <= Number(loanId) || Number(loanId) === 0) {
    return null
  }

  loan = await tinlake.getLoan(loanId)
  if (!loan) return null

  const nftData = await getNFT(loan.registry, tinlake, `${loan.tokenId}`)
  loan.nft = (nftData && (nftData as any).nft) || {}
  await addProxyDetails(tinlake, loan)

  return loan
}

export async function addProxyDetails(tinlake: ITinlake, loan: Loan) {
  try {
    loan.proxyOwner = (await tinlake.getProxyOwnerByLoan(loan.loanId)).toString()
  } catch (e) {}
}

export async function getLoans(tinlake: ITinlake): Promise<TinlakeResult | PendingTransaction> {
  let loans
  try {
    loans = await tinlake.getLoanList()
  } catch (e) {
    return loggedError(e, 'Could not get loans', '')
  }

  const loansList = []
  for (let i = 0; i < loans.length; i += 1) {
    const loan = loans[i]
    await addProxyDetails(tinlake, loan)
    loansList.push(loan)
  }
  return {
    data: loansList,
  }
}

export async function submitSeniorSupplyOrder(
  tinlake: ITinlake,
  amount: string,
  skipSigning?: boolean
): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()

  if (skipSigning || getAddressMemory(address)?.supportsPermits === false) {
    return await tinlake.submitSeniorSupplyOrderWithAllowance(amount, address)
  }

  try {
    const permit = await tinlake.signSupplyPermit(amount, address, 'senior')
    return tinlake.submitSeniorSupplyOrderWithPermit(amount, permit)
  } catch (e) {
    if (e.message.includes('Not supported on this device')) {
      setAddressMemory(address, 'supportsPermits', false)
      return await tinlake.submitSeniorSupplyOrderWithAllowance(amount, address)
    }

    return { status: 0, error: e.message }
  }
}

export async function cancelSeniorSupplyOrder(tinlake: ITinlake): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()
  const epochId = await tinlake.getCurrentEpochId()
  const orderedInEpoch = await tinlake.getSeniorOrderedInEpoch(address)

  if (epochId !== orderedInEpoch) {
    const disbursements = await tinlake.calcSeniorDisburse(address)

    if (disbursements.remainingSupplyCurrency.isZero() === false) {
      const disburseTx = await tinlake.disburseSenior()
      await tinlake.getTransactionReceipt(disburseTx)
    }
  }

  return tinlake.submitSeniorSupplyOrder('0')
}

export async function submitJuniorSupplyOrder(
  tinlake: ITinlake,
  amount: string,
  skipSigning?: boolean
): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()

  if (skipSigning || getAddressMemory(address)?.supportsPermits === false) {
    return await tinlake.submitJuniorSupplyOrderWithAllowance(amount, address)
  }

  try {
    const permit = await tinlake.signSupplyPermit(amount, address, 'junior')
    return tinlake.submitJuniorSupplyOrderWithPermit(amount, permit)
  } catch (e) {
    if (e.message.includes('Not supported on this device')) {
      setAddressMemory(address, 'supportsPermits', false)
      return await tinlake.submitJuniorSupplyOrderWithAllowance(amount, address)
    }

    return { status: 0, error: e.message }
  }
}

export async function cancelJuniorSupplyOrder(tinlake: ITinlake): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()
  const epochId = await tinlake.getCurrentEpochId()
  const orderedInEpoch = await tinlake.getJuniorOrderedInEpoch(address)

  if (epochId !== orderedInEpoch) {
    const disbursements = await tinlake.calcJuniorDisburse(address)

    if (disbursements.remainingSupplyCurrency.isZero() === false) {
      const disburseTx = await tinlake.disburseJunior()
      await tinlake.getTransactionReceipt(disburseTx)
    }
  }

  return tinlake.submitJuniorSupplyOrder('0')
}

export async function submitSeniorRedeemOrder(
  tinlake: ITinlake,
  amount: string,
  skipSigning?: boolean
): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()

  if (skipSigning || getAddressMemory(address)?.supportsPermits === false) {
    return await tinlake.submitSeniorRedeemOrderWithAllowance(amount, address)
  }

  try {
    const permit = await tinlake.signRedeemPermit(amount, address, 'senior')
    return tinlake.submitSeniorRedeemOrderWithPermit(amount, permit)
  } catch (e) {
    if (e.message.includes('Not supported on this device')) {
      setAddressMemory(address, 'supportsPermits', false)
      return await tinlake.submitSeniorRedeemOrderWithAllowance(amount, address)
    }

    return { status: 0, error: e.message }
  }
}

export async function cancelSeniorRedeemOrder(tinlake: ITinlake): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()
  const epochId = await tinlake.getCurrentEpochId()
  const orderedInEpoch = await tinlake.getSeniorOrderedInEpoch(address)

  if (epochId !== orderedInEpoch) {
    const disbursements = await tinlake.calcSeniorDisburse(address)

    if (disbursements.remainingRedeemToken.isZero() === false) {
      const disburseTx = await tinlake.disburseSenior()
      await tinlake.getTransactionReceipt(disburseTx)
    }
  }

  return tinlake.submitSeniorRedeemOrder('0')
}

export async function submitJuniorRedeemOrder(
  tinlake: ITinlake,
  amount: string,
  skipSigning?: boolean
): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()

  if (skipSigning || getAddressMemory(address)?.supportsPermits === false) {
    return await tinlake.submitJuniorRedeemOrderWithAllowance(amount, address)
  }

  try {
    const permit = await tinlake.signRedeemPermit(amount, address, 'junior')
    return tinlake.submitJuniorRedeemOrderWithPermit(amount, permit)
  } catch (e) {
    if (e.message.includes('Not supported on this device')) {
      setAddressMemory(address, 'supportsPermits', false)
      return await tinlake.submitJuniorRedeemOrderWithAllowance(amount, address)
    }

    return { status: 0, error: e.message }
  }
}

export async function cancelJuniorRedeemOrder(tinlake: ITinlake): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()
  const epochId = await tinlake.getCurrentEpochId()
  const orderedInEpoch = await tinlake.getJuniorOrderedInEpoch(address)

  if (epochId !== orderedInEpoch) {
    const disbursements = await tinlake.calcJuniorDisburse(address)

    if (disbursements.remainingRedeemToken.isZero() === false) {
      const disburseTx = await tinlake.disburseJunior()
      await tinlake.getTransactionReceipt(disburseTx)
    }
  }

  return tinlake.submitJuniorRedeemOrder('0')
}

export async function disburseSenior(tinlake: ITinlake): Promise<PendingTransaction> {
  return tinlake.disburseSenior()
}

export async function disburseJunior(tinlake: ITinlake): Promise<PendingTransaction> {
  return tinlake.disburseJunior()
}

export async function solveEpoch(tinlake: ITinlake): Promise<PendingTransaction> {
  return tinlake.solveEpoch()
}

export async function executeEpoch(tinlake: ITinlake): Promise<PendingTransaction> {
  return tinlake.executeEpoch()
}

export async function updateJuniorMemberList(
  tinlake: ITinlake,
  user: string,
  validUntil: number
): Promise<PendingTransaction> {
  return tinlake.updateJuniorMemberList(user, validUntil)
}

export async function updateSeniorMemberList(
  tinlake: ITinlake,
  user: string,
  validUntil: number
): Promise<PendingTransaction> {
  return tinlake.updateSeniorMemberList(user, validUntil)
}

export async function getEpoch(tinlake: ITinlake): Promise<EpochData | undefined> {
  const address = await tinlake.signer?.getAddress()
  const state = await tinlake.getCurrentEpochState()

  const minimumEpochTime = await tinlake.getMinimumEpochTime()
  const lastEpochClosed = await tinlake.getLastEpochClosed()
  const minimumEpochTimeLeft = lastEpochClosed + minimumEpochTime - new Date().getTime() / 1000

  return {
    state,
    minimumEpochTime,
    minimumEpochTimeLeft,
    lastEpochClosed,
    id: await tinlake.getCurrentEpochId(),
    isBlockedState:
      state === 'in-submission-period' || state === 'in-challenge-period' || state === 'challenge-period-ended',
    minChallengePeriodEnd: await tinlake.getMinChallengePeriodEnd(),
    latestBlockTimestamp: await tinlake.getLatestBlockTimestamp(),
    seniorOrderedInEpoch: address ? await tinlake.getSeniorOrderedInEpoch(address) : 0,
    juniorOrderedInEpoch: address ? await tinlake.getJuniorOrderedInEpoch(address) : 0,
  }
}

export async function borrow(tinlake: ITinlake, loan: Loan, amount: string): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const { loanId } = loan
  const address = await tinlake.signer.getAddress()
  const proxy = loan.ownerOf

  // make sure tranche has enough funds
  const juniorReserve = await tinlake.getJuniorReserve()
  const seniorReserve = await tinlake.getSeniorReserve()
  const trancheReserve = juniorReserve.add(seniorReserve)
  if (new BN(amount).cmp(trancheReserve) > 0) {
    return loggedError({}, 'There is not enough available funds.', loanId)
  }

  // borrow with proxy
  return tinlake.proxyLockBorrowWithdraw(proxy.toString(), loanId, amount, address!)
}

// repay partial loan debt
export async function repay(tinlake: ITinlake, loan: Loan, amount: string): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const { loanId } = loan
  const proxy = loan.ownerOf
  const address = await tinlake.signer.getAddress()

  // make sure that enough funds are provided to cover the repay amount
  const allowance = await tinlake.getCurrencyAllowance(address!, proxy.toString())

  // only approve if allowance is smaller than than the current balance
  if (allowance.lt(new BN(amount))) {
    try {
      const approveTx = await tinlake.approveCurrency(proxy.toString(), maxUint256)
      await tinlake.getTransactionReceipt(approveTx as any)
    } catch (e) {
      return loggedError(e, 'Could not approve proxy.', loanId)
    }
  }

  // repay
  return tinlake.proxyRepay(proxy.toString(), loanId, amount)
}

// repay full loan debt
export async function repayFull(tinlake: ITinlake, loan: Loan): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const { loanId } = loan
  const proxy = loan.ownerOf
  const address = await tinlake.signer.getAddress()

  // use entire user balance as repay amount to make sure that enough funds are provided to cover the entire debt
  const balance = await tinlake.getCurrencyBalance(address!)
  const allowance = await tinlake.getCurrencyAllowance(address!, proxy.toString())

  // only approve if allowance is smaller than than the current balance
  if (allowance.lt(balance)) {
    try {
      const approveTx = await tinlake.approveCurrency(proxy.toString(), maxUint256)
      await tinlake.getTransactionReceipt(approveTx as any)
    } catch (e) {
      return loggedError(e, 'Could not approve proxy.', loanId)
    }
  }

  // repay
  return tinlake.proxyRepayUnlockClose(proxy.toString(), loan.tokenId.toString(), loanId, loan.registry)
}

export async function getInvestor(tinlake: ITinlake, address: string) {
  return tinlake.getInvestor(address)
}

export async function setMinJuniorRatio(tinlake: ITinlake, ratio: string): Promise<PendingTransaction> {
  return tinlake.setMinimumJuniorRatio(ratio)
}

export async function setMaxJuniorRatio(tinlake: ITinlake, ratio: string): Promise<PendingTransaction> {
  return tinlake.setMaximumJuniorRatio(ratio)
}

export async function setMaxReserve(tinlake: ITinlake, ratio: string): Promise<PendingTransaction> {
  return tinlake.setMaximumReserve(ratio)
}

function loggedError(error: any, message: string, id: string): PendingTransaction {
  console.error(`${message} ${id}`, error)
  // TODO: same as line 549
  return {
    status: 0,
    error: message,
  } as any
}
