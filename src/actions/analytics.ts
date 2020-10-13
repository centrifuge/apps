import { Constructor, TinlakeParams } from '../Tinlake'
import { ZERO_ADDRESS } from '../services/ethereum'
import { Loan, Investor } from '../types/tinlake'
import BN from 'bn.js'

export function AnalyticsActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IAnalyticsActions {
    // borrower analytics
    getCurrentNAV = async (): Promise<BN> => {
      return (await this.contract('FEED').currentNAV()).toBN()
    }

    getTotalDebt = async (): Promise<BN> => {
      return (await this.contract('PILE').total()).toBN()
    }

    getPrincipal = async (loanId: string): Promise<BN> => {
      return (await this.contract('FEED').ceiling(loanId)).toBN()
    }
    getDebt = async (loanId: string): Promise<BN> => {
      return (await this.contract('PILE').debt(loanId)).toBN()
    }

    loanCount = async (): Promise<BN> => {
      return (await this.contract('TITLE').count()).toBN()
    }

    getCollateral = async (loanId: string): Promise<any> => {
      return await this.contract('SHELF').shelf(loanId)
    }

    getOwnerOfCollateral = async (nftRegistryAddress: string, tokenId: string): Promise<BN> => {
      return this.contract('COLLATERAL_NFT', nftRegistryAddress).ownerOf(tokenId)
    }

    getRiskGroup = async (loanId: string): Promise<BN> => {
      // retrieve nftId = hash from tokenID & registry
      const nftId = await this.contract('FEED').nftID(loanId)

      // retrieve riskgroup from nft
      return (await this.contract('FEED').risk(nftId)).toBN()
    }

    getInterestRate = async (loanId: string): Promise<BN> => {
      const riskGroup = await this.getRiskGroup(loanId)

      // retrieve rates for this risk group
      const res = await this.contract('PILE').rates(riskGroup.toNumber())
      return res[2].toBN()
    }

    getOwnerOfLoan = async (loanId: string): Promise<any> => {
      let address
      try {
        address = await this.contract('TITLE').ownerOf(loanId)
      } catch (e) {
        address = ZERO_ADDRESS
      }
      return address
    }

    getStatus = async (nftRegistryAddr: string, tokenId: string, loanId: string): Promise<any> => {
      if ((await this.getOwnerOfCollateral(nftRegistryAddr, tokenId)).toString() === this.contracts['SHELF']!.address) {
        return 'ongoing'
      }
      if ((await this.getOwnerOfLoan(loanId)) === ZERO_ADDRESS) {
        return 'closed'
      }
      return 'opened'
    }

    getLoan = async (loanId: string): Promise<Loan | null> => {
      if (loanId === '0') {
        return null
      }
      const collateral = await this.getCollateral(loanId)
      const principal = await this.getPrincipal(loanId)
      const ownerOf = await this.getOwnerOfLoan(loanId)
      const interestRate = await this.getInterestRate(loanId)
      const debt = await this.getDebt(loanId)
      const status = await this.getStatus(collateral.registry, collateral.tokenId, loanId)
      const riskGroup = (await this.getRiskGroup(loanId)).toNumber()

      return {
        loanId,
        principal,
        interestRate,
        ownerOf,
        debt,
        status,
        riskGroup,
        registry: collateral.registry,
        tokenId: collateral.tokenId,
      }
    }

    getLoanList = async (): Promise<Loan[]> => {
      const loanArray = []
      const count = (await this.loanCount()).toNumber()
      for (let i = 0; i < count; i += 1) {
        const loan = await this.getLoan(i.toString())
        loan && loanArray.push(loan)
      }
      return loanArray
    }

    // lender analytics
    getInvestor = async (user: string): Promise<Investor | undefined> => {
      if (typeof user === 'undefined' || user === '') return undefined

      const includeSenior = this.existsSenior()
      const tokenBalanceJunior = await this.getJuniorTokenBalance(user)
      const tokenBalanceSenior = (includeSenior && (await this.getSeniorTokenBalance(user))) || new BN(0)
      const maxSupplyJunior = await this.getMaxSupplyAmountJunior(user) // REV: remove, or return DAI balance of user
      const maxSupplySenior = (includeSenior && (await this.getMaxSupplyAmountSenior(user))) || new BN(0) // REV: remove, or return DAI balance of user

      return {
        junior: {
          tokenBalance: tokenBalanceJunior,
          maxSupply: maxSupplyJunior,
        },
        senior: {
          tokenBalance: tokenBalanceSenior || new BN(0),
          maxSupply: maxSupplySenior || new BN(0),
        },
        address: user,
      }
    }

    getJuniorTokenBalance = async (user: string) => {
      return (await this.contract('JUNIOR_TOKEN').balanceOf(user)).toBN()
    }

    checkHasInvestedInJunior = async (user: string) => {
      const userOrder = await this.contract('JUNIOR_TRANCHE').users(user)

      if (!userOrder) return false
      return !userOrder.orderedInEpoch.toBN().isZero()
    }

    getJuniorOrderedInEpoch = async (user: string) => {
      const userOrder = await this.contract('JUNIOR_TRANCHE').users(user)

      if (!userOrder) return 0
      return userOrder.orderedInEpoch.toBN().toNumber()
    }

    getJuniorTokenSymbol = async () => {
      const symbol = await this.contract('JUNIOR_TOKEN').symbol()

      if (!symbol || symbol.length === 0) {
        return `${this.contractAddresses['JUNIOR_TOKEN']?.substr(2, 2).toUpperCase()}TIN`
      }
      return symbol
    }

    getJuniorTokenDecimals = async () => {
      return await this.contract('JUNIOR_TOKEN').decimals()
    }

    getJuniorTotalSupply = async () => {
      return (await this.contract('JUNIOR_TOKEN').totalSupply()).toBN()
    }

    getMaxSupplyAmountJunior = async (user: string) => {
      return (await this.contract('TINLAKE_CURRENCY').balanceOf(user)).toBN()
    }

    getTokenPriceJunior = async () => {
      return (await this.contract('ASSESSOR')['calcJuniorTokenPrice()']()).toBN()
    }

    existsSenior = () => {
      return this.contractAddresses['SENIOR_OPERATOR'] !== ZERO_ADDRESS
    }

    getSeniorTokenBalance = async (user: string) => {
      if (!this.existsSenior()) return new BN(0)
      return (await this.contract('SENIOR_TOKEN').balanceOf(user)).toBN()
    }

    checkHasInvestedInSenior = async (user: string) => {
      if (!this.existsSenior()) return false
      const userOrder = await this.contract('SENIOR_TRANCHE').users(user)

      if (!userOrder) return false
      return !userOrder.orderedInEpoch.toBN().isZero()
    }

    getSeniorOrderedInEpoch = async (user: string) => {
      if (!this.existsSenior()) return 0
      const userOrder = await this.contract('SENIOR_TRANCHE').users(user)

      if (!userOrder) return 0
      return userOrder.orderedInEpoch.toBN().toNumber()
    }

    getSeniorTokenSymbol = async () => {
      if (!this.existsSenior()) return undefined
      const symbol = await this.contract('SENIOR_TOKEN').symbol()

      if (!symbol || symbol.length === 0) {
        return `${this.contractAddresses['SENIOR_TOKEN']?.substr(2, 2).toUpperCase()}DRP`
      }
      return symbol
    }

    getSeniorTokenDecimals = async () => {
      if (!this.existsSenior()) return undefined
      return await this.contract('SENIOR_TOKEN').decimals()
    }

    getSeniorTotalSupply = async () => {
      if (!this.existsSenior()) return new BN(0)
      return (await this.contract('SENIOR_TOKEN').totalSupply()).toBN()
    }

    getSeniorPendingInvestments = async () => {
      if (!this.existsSenior()) return new BN(0)
      return (await this.contract('SENIOR_TRANCHE').totalSupply()).toBN()
    }

    getSeniorPendingRedemptions = async () => {
      if (!this.existsSenior()) return new BN(0)
      return (await this.contract('SENIOR_TRANCHE').totalRedeem()).toBN()
    }

    getJuniorPendingInvestments = async () => {
      return (await this.contract('JUNIOR_TRANCHE').totalSupply()).toBN()
    }

    getJuniorPendingRedemptions = async () => {
      return (await this.contract('JUNIOR_TRANCHE').totalRedeem()).toBN()
    }

    getMaxSupplyAmountSenior = async (user: string) => {
      if (!this.existsSenior()) return new BN(0)
      return (await this.contract('TINLAKE_CURRENCY').balanceOf(user)).toBN()
    }

    getTokenPriceSenior = async () => {
      return (await this.contract('ASSESSOR')['calcSeniorTokenPrice()']()).toBN()
    }

    getSeniorReserve = async () => {
      if (this.contractAddresses['SENIOR_TRANCHE'] !== ZERO_ADDRESS) {
        return (await this.contract('ASSESSOR').seniorBalance_()).toBN()
      }
      return new BN(0)
    }

    getJuniorReserve = async () => {
      const seniorBalance = await this.getSeniorReserve()
      const totalBalance = (await this.contract('RESERVE').totalBalance()).toBN()
      return totalBalance.sub(seniorBalance)
    }

    getMinJuniorRatio = async () => {
      return seniorToJuniorRatio((await this.contract('ASSESSOR').maxSeniorRatio()).toBN())
    }

    getMaxJuniorRatio = async () => {
      return seniorToJuniorRatio((await this.contract('ASSESSOR').minSeniorRatio()).toBN())
    }

    getMaxReserve = async () => {
      return (await this.contract('ASSESSOR').maxReserve()).toBN()
    }

    getCurrentJuniorRatio = async () => {
      return seniorToJuniorRatio((await this.contract('ASSESSOR').seniorRatio()).toBN())
    }

    getAssetValueJunior = async () => {
      return (await this.contract('ASSESSOR').calcAssetValue(this.contractAddresses['JUNIOR_TRANCHE'])).toBN()
    }

    getSeniorDebt = async () => {
      if (this.contractAddresses['SENIOR_TRANCHE'] !== ZERO_ADDRESS) {
        return (await this.contract('ASSESSOR').seniorDebt_()).toBN()
      }
      return new BN(0)
    }

    getSeniorInterestRate = async () => {
      if (this.contractAddresses['SENIOR_TRANCHE'] !== ZERO_ADDRESS) {
        return (await this.contract('ASSESSOR').seniorInterestRate()).toBN()
      }
      return new BN(0)
    }
  }
}

const seniorToJuniorRatio = (seniorRatio: BN) => {
  return new BN(10).pow(new BN(27)).sub(seniorRatio)
}

export type IAnalyticsActions = {
  getCurrentNAV(): Promise<BN>
  getTotalDebt(): Promise<BN>
  getDebt(loanId: string): Promise<BN>
  loanCount(): Promise<BN>
  getLoanList(): Promise<Loan[]>
  getLoan(loanId: string): Promise<Loan | null>
  getCollateral(loanId: string): Promise<any>
  getPrincipal(loanId: string): Promise<BN>
  getRiskGroup(loanId: string): Promise<BN>
  getInterestRate(loanId: string): Promise<BN>
  getOwnerOfLoan(loanId: string): Promise<BN>
  getOwnerOfCollateral(nftRegistryAddr: string, tokenId: string): Promise<BN>
  existsSenior(): boolean
  getJuniorReserve(): Promise<BN>
  getSeniorReserve(): Promise<BN>
  getJuniorTokenBalance(user: string): Promise<BN>
  getSeniorTokenBalance(user: string): Promise<BN>
  getJuniorTotalSupply(): Promise<BN>
  getSeniorTotalSupply(): Promise<BN>
  getMaxSupplyAmountJunior(user: string): Promise<BN>
  getMaxSupplyAmountSenior(user: string): Promise<BN>
  getTokenPriceJunior(): Promise<BN>
  getTokenPriceSenior(): Promise<BN>
  getSeniorDebt(): Promise<BN>
  getSeniorInterestRate(): Promise<BN>
  getMinJuniorRatio(): Promise<BN>
  getMaxJuniorRatio(): Promise<BN>
  getMaxReserve(): Promise<BN>
  getCurrentJuniorRatio(): Promise<BN>
  getAssetValueJunior(): Promise<BN>
  getInvestor(user: string): Promise<Investor | undefined>
  getSeniorPendingInvestments(): Promise<BN>
  getSeniorPendingRedemptions(): Promise<BN>
  getJuniorPendingInvestments(): Promise<BN>
  getJuniorPendingRedemptions(): Promise<BN>
  getJuniorTokenSymbol(): Promise<string>
  getSeniorTokenSymbol(): Promise<string>
  getJuniorTokenDecimals(): Promise<number>
  getSeniorTokenDecimals(): Promise<number>
  checkHasInvestedInSenior(user: string): Promise<boolean>
  checkHasInvestedInJunior(usr: string): Promise<boolean>
  getSeniorOrderedInEpoch(user: string): Promise<number>
  getJuniorOrderedInEpoch(user: string): Promise<number>
}

export default AnalyticsActions
