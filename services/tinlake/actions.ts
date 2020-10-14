import BN from 'bn.js'
import { Loan, interestRateToFee, ITinlake, PendingTransaction } from '@centrifuge/tinlake-js'
import { ITinlake as ITinlakeV3, NFT } from '@centrifuge/tinlake-js-v3'
import { maxUint256 } from '../../utils/maxUint256'
import { PoolData, PoolDataV3, EpochData } from '../../ducks/pool'
import { isTinlakeV3 } from '../../utils/tinlakeVersion'

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
export type TinlakeV3Action = (tinlake: ITinlakeV3, ...args: Serializable[]) => Promise<PendingTransaction>

export async function getNFT(registry: string, tinlake: ITinlake | ITinlakeV3, tokenId: string) {
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
    if (tinlake.version === 3) {
      const nftId = await (tinlake as ITinlakeV3).getNftFeedId(registry, tokenId)
      maturityDate = (await (tinlake as ITinlakeV3).getNftMaturityDate(nftId)).toNumber()
    }
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

async function getOrCreateProxy(tinlake: ITinlake | ITinlakeV3, address: string) {
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
  tinlake: ITinlake | ITinlakeV3,
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
  tinlake: ITinlake | ITinlakeV3,
  nftFeedId: string,
  value: string,
  riskGroup: string
): Promise<PendingTransaction> => {
  if (isTinlakeV3(tinlake)) {
    return tinlake.updateNftFeed(nftFeedId, value, riskGroup)
  }
  return tinlake.updateNftFeed(nftFeedId, Number(value), Number(riskGroup))
}

export const setMaturityDate = async (
  tinlake: ITinlakeV3,
  nftFeedId: string,
  timestampSecs: number
): Promise<PendingTransaction> => {
  return tinlake.setMaturityDate(nftFeedId, timestampSecs)
}

export const issue = async (
  tinlake: ITinlake | ITinlakeV3,
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

export async function getProxyOwner(tinlake: ITinlake | ITinlakeV3, loanId: string): Promise<TinlakeResult> {
  let owner = ZERO_ADDRESS
  try {
    owner = (await tinlake.getProxyOwnerByLoan(loanId)).toString()
  } catch (e) {}
  return { data: owner }
}

export async function getLoan(tinlake: ITinlake | ITinlakeV3, loanId: string): Promise<Loan | null> {
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

async function addProxyDetails(tinlake: ITinlake | ITinlakeV3, loan: Loan) {
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

export async function setInterest(
  tinlake: ITinlake,
  loanId: string,
  debt: string,
  rate: string
): Promise<PendingTransaction> {
  const rateGroup = interestRateToFee(rate)
  const existsRateGroup = await tinlake.existsRateGroup(rateGroup)

  // init rate group
  if (!existsRateGroup) {
    try {
      const initRateTx = await tinlake.initRate(rateGroup)
      await tinlake.getTransactionReceipt(initRateTx)
    } catch (e) {
      return loggedError(e, 'Could not init rate group', loanId)
    }
  }
  // set rate group
  if (debt.toString() === '0') {
    return tinlake.setRate(loanId, rateGroup)
  }
  return tinlake.changeRate(loanId, rateGroup)
}

export async function submitSeniorSupplyOrder(tinlake: ITinlakeV3, amount: string): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()
  return tinlake.submitSeniorSupplyOrderWithPermit(amount, address)
}

export async function cancelSeniorSupplyOrder(tinlake: ITinlakeV3): Promise<PendingTransaction> {
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

export async function submitJuniorSupplyOrder(tinlake: ITinlakeV3, amount: string): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()
  return tinlake.submitJuniorSupplyOrderWithPermit(amount, address)
}

export async function cancelJuniorSupplyOrder(tinlake: ITinlakeV3): Promise<PendingTransaction> {
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

export async function submitSeniorRedeemOrder(tinlake: ITinlakeV3, amount: string): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()
  return tinlake.submitSeniorRedeemOrderWithPermit(amount, address)
}

export async function cancelSeniorRedeemOrder(tinlake: ITinlakeV3): Promise<PendingTransaction> {
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

export async function submitJuniorRedeemOrder(tinlake: ITinlakeV3, amount: string): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer?.getAddress()
  return tinlake.submitJuniorRedeemOrderWithPermit(amount, address)
}

export async function cancelJuniorRedeemOrder(tinlake: ITinlakeV3): Promise<PendingTransaction> {
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

export async function disburseSenior(tinlake: ITinlakeV3): Promise<PendingTransaction> {
  return tinlake.disburseSenior()
}

export async function disburseJunior(tinlake: ITinlakeV3): Promise<PendingTransaction> {
  return tinlake.disburseJunior()
}

export async function solveEpoch(tinlake: ITinlakeV3): Promise<PendingTransaction> {
  return tinlake.solveEpoch()
}

export async function executeEpoch(tinlake: ITinlakeV3): Promise<PendingTransaction> {
  return tinlake.executeEpoch()
}

export async function getPool(tinlake: ITinlake | ITinlakeV3): Promise<PoolData | PoolDataV3 | null> {
  if (isTinlakeV3(tinlake)) {
    return getPoolV3(tinlake)
  }
  return getPoolV2(tinlake)
}

export async function getPoolV2(tinlake: ITinlake): Promise<PoolData | null> {
  const juniorReserve = await tinlake.getJuniorReserve()
  const juniorTokenPrice = await tinlake.getTokenPriceJunior()
  const seniorReserve = await tinlake.getSeniorReserve()
  const seniorTokenPrice = tinlake.signer
    ? await tinlake.getTokenPriceSenior(await tinlake.signer.getAddress())
    : new BN(0)
  const seniorInterestRate = await tinlake.getSeniorInterestRate()
  const seniorTokenSupply = await tinlake.getSeniorTotalSupply()
  const minJuniorRatio = await tinlake.getMinJuniorRatio()
  const juniorAssetValue = await tinlake.getAssetValueJunior()
  const juniorTokenSupply = await tinlake.getJuniorTotalSupply()
  // temp fix: until solved on contract level
  const currentJuniorRatio = juniorAssetValue.toString() === '0' ? new BN(0) : await tinlake.getCurrentJuniorRatio()

  return {
    minJuniorRatio,
    currentJuniorRatio,
    junior: {
      type: 'junior',
      availableFunds: juniorReserve,
      tokenPrice: juniorTokenPrice,
      totalSupply: juniorTokenSupply,
      token: 'TIN',
    },
    senior: {
      type: 'senior',
      availableFunds: seniorReserve,
      tokenPrice: seniorTokenPrice,
      totalSupply: seniorTokenSupply,
      token: 'DROP',
      interestRate: seniorInterestRate,
    },
    availableFunds: juniorReserve.add(seniorReserve),
  }
}

export async function getEpoch(tinlake: ITinlakeV3): Promise<EpochData | undefined> {
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

export async function getPoolV3(tinlake: ITinlakeV3): Promise<PoolDataV3 | null> {
  const juniorReserve = await tinlake.getJuniorReserve()
  const juniorTokenPrice = await tinlake.getTokenPriceJunior()
  const seniorReserve = await tinlake.getSeniorReserve()
  const seniorTokenPrice = await tinlake.getTokenPriceSenior()
  const seniorInterestRate = await tinlake.getSeniorInterestRate()
  const seniorTokenSupply = await tinlake.getSeniorTotalSupply()
  const minJuniorRatio = await tinlake.getMinJuniorRatio()
  const maxJuniorRatio = await tinlake.getMaxJuniorRatio()
  const maxReserve = await tinlake.getMaxReserve()
  const juniorTokenSupply = await tinlake.getJuniorTotalSupply()
  const currentJuniorRatio = await tinlake.getCurrentJuniorRatio()

  const netAssetValue = await tinlake.getCurrentNAV()
  const reserve = juniorReserve.add(seniorReserve)
  const outstandingVolume = await tinlake.getTotalDebt()

  const seniorPendingInvestments = await tinlake.getSeniorPendingInvestments()
  const seniorPendingRedemptions = await tinlake.getSeniorPendingRedemptions()
  const juniorPendingInvestments = await tinlake.getJuniorPendingInvestments()
  const juniorPendingRedemptions = await tinlake.getJuniorPendingRedemptions()

  const totalPendingInvestments = seniorPendingInvestments.add(juniorPendingInvestments)

  const juniorRedemptionsCurrency = new BN(juniorPendingRedemptions)
    .mul(new BN(juniorTokenPrice))
    .div(new BN(10).pow(new BN(27)))

  const seniorRedemptionsCurrency = new BN(seniorPendingRedemptions)
    .mul(new BN(seniorTokenPrice))
    .div(new BN(10).pow(new BN(27)))

  const totalRedemptionsCurrency = juniorRedemptionsCurrency.add(seniorRedemptionsCurrency)

  const seniorSymbol = await tinlake.getSeniorTokenSymbol()
  const seniorDecimals = await tinlake.getSeniorTokenDecimals()
  const juniorSymbol = await tinlake.getJuniorTokenSymbol()
  const juniorDecimals = await tinlake.getJuniorTokenDecimals()

  const epoch = await getEpoch(tinlake)

  return {
    minJuniorRatio,
    maxJuniorRatio,
    currentJuniorRatio,
    maxReserve,
    netAssetValue,
    outstandingVolume,
    reserve,
    epoch,
    totalPendingInvestments,
    totalRedemptionsCurrency,
    junior: {
      type: 'junior',
      availableFunds: juniorReserve,
      tokenPrice: juniorTokenPrice,
      totalSupply: juniorTokenSupply,
      token: juniorSymbol,
      decimals: juniorDecimals,
      address: tinlake.contractAddresses['JUNIOR_TOKEN'],
      pendingInvestments: juniorPendingInvestments,
      pendingRedemptions: juniorPendingRedemptions,
    },
    senior: {
      type: 'senior',
      availableFunds: seniorReserve,
      tokenPrice: seniorTokenPrice,
      totalSupply: seniorTokenSupply,
      token: seniorSymbol,
      decimals: seniorDecimals,
      address: tinlake.contractAddresses['SENIOR_TOKEN'],
      interestRate: seniorInterestRate,
      pendingInvestments: seniorPendingInvestments,
      pendingRedemptions: seniorPendingRedemptions,
    },
    availableFunds: juniorReserve.add(seniorReserve),
  }
}

export async function borrow(tinlake: ITinlake | ITinlakeV3, loan: Loan, amount: string): Promise<PendingTransaction> {
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
export async function repay(tinlake: ITinlake | ITinlakeV3, loan: Loan, amount: string): Promise<PendingTransaction> {
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
export async function repayFull(tinlake: ITinlake | ITinlakeV3, loan: Loan): Promise<PendingTransaction> {
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

export async function getInvestor(tinlake: ITinlake | ITinlakeV3, address: string) {
  return tinlake.getInvestor(address)
}

export async function setAllowance(
  tinlake: ITinlake,
  address: string,
  maxSupplyAmount: string,
  maxRedeemAmount: string,
  trancheType: TrancheType
): Promise<PendingTransaction> {
  if (trancheType === 'junior') {
    return tinlake.approveAllowanceJunior(address, maxSupplyAmount, maxRedeemAmount)
  }
  return tinlake.approveAllowanceSenior(address, maxSupplyAmount, maxRedeemAmount)
}

export async function setMinJuniorRatio(tinlake: ITinlake | ITinlakeV3, ratio: string): Promise<PendingTransaction> {
  return tinlake.setMinimumJuniorRatio(ratio)
}

export async function setMaxJuniorRatio(tinlake: ITinlakeV3, ratio: string): Promise<PendingTransaction> {
  return tinlake.setMaximumJuniorRatio(ratio)
}

export async function setMaxReserve(tinlake: ITinlakeV3, ratio: string): Promise<PendingTransaction> {
  return tinlake.setMaximumReserve(ratio)
}

export async function supply(
  tinlake: ITinlake,
  supplyAmount: string,
  trancheType: TrancheType
): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer.getAddress()

  let allowance = new BN(0)
  if (trancheType === 'junior') {
    allowance = (await tinlake.getJuniorForCurrencyAllowance(address!)) || new BN(0)
  } else if (trancheType === 'senior') {
    allowance = (await tinlake.getSeniorForCurrencyAllowance(address!)) || new BN(0)
  }

  // only approve if allowance is smaller than than supplyAmount
  if (allowance.lt(new BN(supplyAmount))) {
    // approve currency
    try {
      if (trancheType === 'junior') {
        const approvalTx = await tinlake.approveJuniorForCurrency(maxUint256)
        await tinlake.getTransactionReceipt(approvalTx!)
      } else if (trancheType === 'senior') {
        const approvalTx = await tinlake.approveSeniorForCurrency(maxUint256)
        await tinlake.getTransactionReceipt(approvalTx!)
      }
    } catch (e) {
      return loggedError(e, `Could not approve currency for ${trancheType}.`, '')
    }
  }

  // supply
  try {
    if (trancheType === 'junior') {
      const res = await tinlake.supplyJunior(supplyAmount)
      return res
    }
    const res = await tinlake.supplySenior(supplyAmount)
    return res
  } catch (e) {
    return loggedError(e, `Could not supply ${trancheType}`, '')
  }
}

export async function redeem(
  tinlake: ITinlake,
  redeemAmount: string,
  trancheType: TrancheType
): Promise<PendingTransaction> {
  if (!tinlake.signer) {
    throw new Error('Missing tinlake signer')
  }

  const address = await tinlake.signer.getAddress()

  let allowance = new BN(0)
  if (trancheType === 'junior') {
    allowance = (await tinlake.getJuniorTokenAllowance(address!)) || new BN(0)
  } else if (trancheType === 'senior') {
    allowance = (await tinlake.getSeniorTokenAllowance(address!)) || new BN(0)
  }

  // only approve if allowance is smaller than than redeemAmount
  if (allowance.lt(new BN(redeemAmount))) {
    // approve junior token
    try {
      if (trancheType === 'junior') {
        const approveTx = await tinlake.approveJuniorToken(maxUint256)
        await tinlake.getTransactionReceipt(approveTx)
      } else if (trancheType === 'senior') {
        const approveTx = await tinlake.approveSeniorToken(maxUint256)
        await tinlake.getTransactionReceipt(approveTx)
      }
    } catch (e) {
      return loggedError(e, `Could not approve ${trancheType} Token.`, '')
    }
  }

  // repay
  try {
    if (trancheType === 'junior') {
      return tinlake.redeemJunior(redeemAmount)
    }
    if (trancheType === 'senior') {
      return tinlake.redeemSenior(redeemAmount)
    }
  } catch (e) {
    return loggedError(e, `Could not redeem ${trancheType}.`, '')
  }

  // TODO: the PendingTransaction type contains a .receipt() required parameter. This should change to an optional parameter (or be removed), but that means we need to publish a new version of Tinlake.js v2 and v3 to npm. So that first needs to be done before this any cast can be removed.
  return { status: 0 } as any
}

function loggedError(error: any, message: string, id: string): PendingTransaction {
  console.error(`${message} ${id}`, error)
  // TODO: same as line 549
  return {
    status: 0,
    error: message,
  } as any
}
