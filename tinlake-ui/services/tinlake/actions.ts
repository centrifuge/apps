import { ITinlake, Loan, NFT, PendingTransaction } from '@centrifuge/tinlake-js'
import { IRiskGroup, IWriteOffGroup } from '@centrifuge/tinlake-js/dist/actions/admin'
import BN from 'bn.js'
import { ZERO_ADDRESS } from '../../constants'
import { maxUint256 } from '../../utils/maxUint256'
import { Asset } from '../../utils/useAsset'
import { getAddressMemory, setAddressMemory } from './address-memory'

export type TrancheType = 'junior' | 'senior'

export interface TinlakeResult {
  data?: any
  errorMsg?: string
  tokenId?: string
  loanId?: string
}

const PERMIT_UNSUPPORTED_CURRENCIES = [
  '0xad3E3Fc59dff318BecEaAb7D00EB4F68b1EcF195',
  '0xb3037647a7E114Da86653Daa8cdCEd738727ab11',
]

const disablePermitSigning = true

// TinlakeAction args need to be serializable, as they are stored in Redux state for the async transactions duck
// Based on: https://github.com/microsoft/TypeScript/issues/1897#issuecomment-657294463
type SerializableScalar = string & number & boolean
type SerializableObject = { [key: string]: SerializableScalar & SerializableObject & SerializableArray }
type SerializableArray = (SerializableScalar & SerializableObject & SerializableArray)[]
type Serializable = SerializableScalar & SerializableObject & SerializableArray

export type TinlakeAction = (tinlake: ITinlake, ...args: Serializable[]) => Promise<PendingTransaction>

export async function getNFT(registry: string, tinlake: ITinlake, tokenId: string) {
  let nftOwner: string | null = null
  let nftData: any
  let maturityDate: number = 0

  try {
    nftOwner = (await tinlake.getOwnerOfCollateral(registry, tokenId)).toString()
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    if (errMessage.match(/invalid address/i)) {
      return loggedError(e, 'Invalid address', tokenId)
    }
    if (errMessage.match(/call revert exception/i)) {
      return loggedError(e, 'Address is not a registry', tokenId)
    }

    if ((e as { data?: string }).data?.match(/reverted/i)) {
      return loggedError(e, 'NFT does not exist in registry', tokenId)
    }
    return loggedError(e, 'Could not get NFT owner', tokenId)
  }

  if (!nftOwner) {
    return loggedError({}, 'Could not get NFT owner', tokenId)
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
    proxyAddress = await tinlake.proxyCreateNew(address)
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
  } catch (e) {
    /* do nothing */
  }
  return { data: owner }
}

export async function getLoan(tinlake: ITinlake, loanId: string): Promise<Loan | null> {
  const count = await tinlake.loanCount()

  if (count.toNumber() <= Number(loanId) || Number(loanId) === 0) {
    return null
  }

  const loan = await tinlake.getLoan(loanId)
  if (!loan) return null

  const nftData = await getNFT(loan.registry, tinlake, `${loan.tokenId}`)
  loan.nft = (nftData && (nftData as any).nft) || {}
  await addProxyDetails(tinlake, loan)

  return loan
}

export async function addProxyDetails(tinlake: ITinlake, loan: Loan) {
  try {
    loan.proxyOwner = (await tinlake.getProxyOwnerByLoan(loan.loanId)).toString()
  } catch (e) {
    /* do nothing */
  }
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

  const currencyDoesntSupportPermits = PERMIT_UNSUPPORTED_CURRENCIES.includes(
    tinlake.contractAddresses.TINLAKE_CURRENCY!
  )

  if (
    disablePermitSigning ||
    currencyDoesntSupportPermits ||
    skipSigning ||
    getAddressMemory(address)?.supportsPermits === false
  ) {
    return await tinlake.submitSeniorSupplyOrderWithAllowance(amount, address)
  }

  try {
    const permit = await tinlake.signSupplyPermit(amount, address, 'senior')
    return tinlake.submitSeniorSupplyOrderWithPermit(amount, permit)
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : ''
    if (errMessage.includes('Not supported on this device')) {
      setAddressMemory(address, 'supportsPermits', false)
      return await tinlake.submitSeniorSupplyOrderWithAllowance(amount, address)
    }

    return { status: 0, error: errMessage }
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

  const currencyDoesntSupportPermits = PERMIT_UNSUPPORTED_CURRENCIES.includes(
    tinlake.contractAddresses.TINLAKE_CURRENCY!
  )

  if (
    disablePermitSigning ||
    currencyDoesntSupportPermits ||
    skipSigning ||
    getAddressMemory(address)?.supportsPermits === false
  ) {
    return await tinlake.submitJuniorSupplyOrderWithAllowance(amount, address)
  }

  try {
    const permit = await tinlake.signSupplyPermit(amount, address, 'junior')
    return tinlake.submitJuniorSupplyOrderWithPermit(amount, permit)
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : ''

    if (errMessage.includes('Not supported on this device')) {
      setAddressMemory(address, 'supportsPermits', false)
      return await tinlake.submitJuniorSupplyOrderWithAllowance(amount, address)
    }

    return { status: 0, error: errMessage }
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

  const currencyDoesntSupportPermits = PERMIT_UNSUPPORTED_CURRENCIES.includes(
    tinlake.contractAddresses.TINLAKE_CURRENCY!
  )

  if (
    disablePermitSigning ||
    currencyDoesntSupportPermits ||
    skipSigning ||
    getAddressMemory(address)?.supportsPermits === false
  ) {
    return await tinlake.submitSeniorRedeemOrderWithAllowance(amount, address)
  }

  try {
    const permit = await tinlake.signRedeemPermit(amount, address, 'senior')
    return tinlake.submitSeniorRedeemOrderWithPermit(amount, permit)
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : ''
    if (errMessage.includes('Not supported on this device')) {
      setAddressMemory(address, 'supportsPermits', false)
      return await tinlake.submitSeniorRedeemOrderWithAllowance(amount, address)
    }

    return { status: 0, error: errMessage }
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

  const currencyDoesntSupportPermits = PERMIT_UNSUPPORTED_CURRENCIES.includes(
    tinlake.contractAddresses.TINLAKE_CURRENCY!
  )

  if (
    disablePermitSigning ||
    currencyDoesntSupportPermits ||
    skipSigning ||
    getAddressMemory(address)?.supportsPermits === false
  ) {
    return await tinlake.submitJuniorRedeemOrderWithAllowance(amount, address)
  }

  try {
    const permit = await tinlake.signRedeemPermit(amount, address, 'junior')
    return tinlake.submitJuniorRedeemOrderWithPermit(amount, permit)
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : ''

    if (errMessage.includes('Not supported on this device')) {
      setAddressMemory(address, 'supportsPermits', false)
      return await tinlake.submitJuniorRedeemOrderWithAllowance(amount, address)
    }

    return { status: 0, error: errMessage }
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

export async function proxyTransferCurrency(
  tinlake: ITinlake,
  proxy: string,
  borrower: string
): Promise<PendingTransaction> {
  return tinlake.proxyTransferCurrency(proxy, borrower)
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

export type EpochData = {
  id: number
  state: 'open' | 'can-be-closed' | 'in-submission-period' | 'in-challenge-period' | 'challenge-period-ended'
  isBlockedState: boolean
  minimumEpochTime: number
  challengeTime: number
  minimumEpochTimeLeft: number
  minChallengePeriodEnd: number
  lastEpochClosed: number
  latestBlockTimestamp: number
  seniorOrderedInEpoch: number
  juniorOrderedInEpoch: number
}
export async function getEpoch(tinlake: ITinlake, address?: string): Promise<EpochData> {
  const signerAddress = address || (await tinlake.signer?.getAddress())
  const state = await tinlake.getCurrentEpochState()

  const minimumEpochTime = await tinlake.getMinimumEpochTime()
  const challengeTime = await tinlake.getChallengeTime()
  const lastEpochClosed = await tinlake.getLastEpochClosed()
  const minimumEpochTimeLeft = lastEpochClosed + minimumEpochTime - new Date().getTime() / 1000

  return {
    state,
    minimumEpochTime,
    challengeTime,
    minimumEpochTimeLeft,
    lastEpochClosed,
    id: await tinlake.getCurrentEpochId(),
    isBlockedState:
      state === 'in-submission-period' || state === 'in-challenge-period' || state === 'challenge-period-ended',
    minChallengePeriodEnd: await tinlake.getMinChallengePeriodEnd(),
    latestBlockTimestamp: await tinlake.getLatestBlockTimestamp(),
    seniorOrderedInEpoch: signerAddress ? await tinlake.getSeniorOrderedInEpoch(signerAddress) : 0,
    juniorOrderedInEpoch: signerAddress ? await tinlake.getJuniorOrderedInEpoch(signerAddress) : 0,
  }
}

export async function lockBorrowWithdraw(tinlake: ITinlake, loan: Asset, amount: string): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const { loanId } = loan
  const address = await tinlake.signer.getAddress()
  const proxy = loan.ownerOf

  // make sure there are enough funds available
  const availableFunds = await tinlake.getAvailableFunds()
  if (new BN(amount).cmp(availableFunds) > 0) {
    return loggedError({}, 'There is not enough available funds.', loanId)
  }

  // borrow with proxy
  return tinlake.proxyLockBorrowWithdraw(proxy.toString(), loanId, amount, address!)
}

export async function borrowWithdraw(tinlake: ITinlake, loan: Asset, amount: string): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const { loanId } = loan
  const address = await tinlake.signer.getAddress()
  const proxy = loan.ownerOf

  // make sure there are enough funds available
  const availableFunds = await tinlake.getAvailableFunds()
  if (new BN(amount).cmp(availableFunds) > 0) {
    return loggedError({}, 'There is not enough available funds.', loanId)
  }

  // borrow with proxy
  return tinlake.proxyBorrowWithdraw(proxy.toString(), loanId, amount, address!)
}

// repay partial loan debt
export async function repay(tinlake: ITinlake, loan: Asset, amount: string): Promise<PendingTransaction> {
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
export async function repayFull(tinlake: ITinlake, loan: Asset): Promise<PendingTransaction> {
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

export const close = async (
  tinlake: ITinlake,
  loan: { loanId: string; ownerOf: string }
): Promise<PendingTransaction> => {
  const { loanId } = loan
  const proxy = loan.ownerOf
  return tinlake.proxyClose(proxy.toString(), loanId)
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

export async function setDiscountRate(tinlake: ITinlake, rate: string): Promise<PendingTransaction> {
  return tinlake.setDiscountRate(rate)
}

export async function setSeniorInterestRate(tinlake: ITinlake, rate: string): Promise<PendingTransaction> {
  return tinlake.setSeniorInterestRate(rate)
}

export async function setMinimumEpochTime(tinlake: ITinlake, value: number): Promise<PendingTransaction> {
  return tinlake.setMinimumEpochTime(value)
}

export async function setChallengeTime(tinlake: ITinlake, value: number): Promise<PendingTransaction> {
  return tinlake.setChallengeTime(value)
}

export async function raiseCreditline(tinlake: ITinlake, amount: string): Promise<PendingTransaction> {
  return tinlake.raiseCreditline(amount)
}

export async function sinkCreditline(tinlake: ITinlake, amount: string): Promise<PendingTransaction> {
  return tinlake.sinkCreditline(amount)
}

export async function updateClaimCFGAccountID(tinlake: ITinlake, centAddress: string): Promise<PendingTransaction> {
  return tinlake.updateClaimCFGAccountID(centAddress)
}

export async function addRiskGroups(tinlake: ITinlake, riskGroups: IRiskGroup[]): Promise<PendingTransaction> {
  return tinlake.addRiskGroups(riskGroups)
}

export async function addWriteOffGroups(
  tinlake: ITinlake,
  writeOffGroups: IWriteOffGroup[]
): Promise<PendingTransaction> {
  return tinlake.addWriteOffGroups(writeOffGroups)
}

export async function writeOff(tinlake: ITinlake, loanId: number): Promise<PendingTransaction> {
  return tinlake.writeOff(loanId)
}

export async function closePool(tinlake: ITinlake): Promise<PendingTransaction> {
  return tinlake.closePool()
}

export async function unclosePool(tinlake: ITinlake): Promise<PendingTransaction> {
  return tinlake.unclosePool()
}

function loggedError(error: any, message: string, id: string): PendingTransaction {
  console.error(`${message} ${id}`, error)
  // TODO: same as line 549
  return {
    id,
    status: 0,
    error: message,
  } as any
}
