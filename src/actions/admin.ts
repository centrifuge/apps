import { ContractName, Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { ZERO_ADDRESS } from '../services/ethereum'
import BN from 'bn.js'
const web3 = require('web3-utils')

export function AdminActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IAdminActions {
    canQueryPermissions = () => {
      return (
        !!this.contract('FEED')?.wards &&
        !!this.contract('ASSESSOR')?.wards &&
        !!this.contract('JUNIOR_OPERATOR')?.wards &&
        !!this.contract('SENIOR_OPERATOR')?.wards &&
        !!this.contract('JUNIOR_MEMBERLIST')?.wards &&
        !!this.contract('SENIOR_MEMBERLIST')?.wards
      )
    }

    isWard = async (user: string, contractName: ContractName) => {
      if (!this.contract(contractName)?.wards) return new BN(0)
      return (await this.contract(contractName).wards(user)).toBN()
    }

    canUpdateNftFeed = async (user: string) => {
      if (!this.contract('FEED')?.wards) return false
      return (await this.contract('FEED').wards(user)).toBN().toNumber() === 1
    }

    canSetSeniorTrancheInterest = async (user: string) => {
      if (!this.contract('ASSESSOR')?.wards) return false
      return (await this.contract('ASSESSOR').wards(user)).toBN().toNumber() === 1
    }

    canSetRiskScore = async (user: string) => {
      if (!this.contract('FEED')?.wards) return false
      return (await this.contract('FEED').wards(user)).toBN().toNumber() === 1
    }
    canSetMinimumJuniorRatio = async (user: string) => {
      if (!this.contract('ASSESSOR')?.wards) return false
      return (await this.contract('ASSESSOR').wards(user)).toBN().toNumber() === 1
    }

    canAddToJuniorMemberList = async (user: string) => {
      if (!this.contract('JUNIOR_MEMBERLIST')?.wards) return false
      return (await this.contract('JUNIOR_MEMBERLIST').wards(user)).toBN().toNumber() === 1
    }

    canAddToSeniorMemberList = async (user: string) => {
      if (!this.contract('SENIOR_MEMBERLIST')?.wards) return false
      if (!(this.contractAddresses['SENIOR_MEMBERLIST'] !== ZERO_ADDRESS)) return false
      return (await this.contract('SENIOR_MEMBERLIST').wards(user)).toBN().toNumber() === 1
    }

    // REV: not used, but can be left
    canSetLoanPrice = async (user: string) => {
      if (!this.contract('COLLECTOR')?.wards) return false
      return (await this.contract('COLLECTOR').wards(user)).toBN().toNumber() === 1
    }

    // ------------ admin functions lender-side -------------
    setMinimumJuniorRatio = async (ratio: string) => {
      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      const maxSeniorRatio = new BN(10).pow(new BN(27)).sub(new BN(ratio))
      return this.pending(
        this.contract('ASSESSOR').file(
          web3.fromAscii('maxSeniorRatio').padEnd(66, '0'),
          maxSeniorRatio.toString(),
          this.overrides
        )
      )
    }

    setMaximumJuniorRatio = async (ratio: string) => {
      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      const minSeniorRatio = new BN(10).pow(new BN(27)).sub(new BN(ratio))
      return this.pending(
        this.contract('ASSESSOR').file(
          web3.fromAscii('minSeniorRatio').padEnd(66, '0'),
          minSeniorRatio.toString(),
          this.overrides
        )
      )
    }

    setMaximumReserve = async (value: string) => {
      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      return this.pending(
        this.contract('ASSESSOR').file(web3.fromAscii('maxReserve').padEnd(66, '0'), value, this.overrides)
      )
    }

    setSeniorTrancheInterest = async (value: string) => {
      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      return this.pending(
        this.contract('ASSESSOR').file(web3.fromAscii('seniorInterestRate').padEnd(66, '0'), value, this.overrides)
      )
    }

    updateJuniorMemberList = async (user: string, validUntil: number) => {
      return this.pending(this.contract('JUNIOR_MEMBERLIST').updateMember(user, validUntil, this.overrides))
    }

    updateSeniorMemberList = async (user: string, validUntil: number) => {
      return this.pending(this.contract('SENIOR_MEMBERLIST').updateMember(user, validUntil, this.overrides))
    }

    // ------------ admin functions lender-side -------------

    getNftFeedId = async (registry: string, tokenId: string) => {
      return await this.contract('FEED')['nftID(address,uint256)'](registry, tokenId)
    }

    getNftFeedValue = async (nftId: string) => {
      return (await this.contract('FEED').nftValues(nftId)).toBN()
    }

    getNftMaturityDate = async (nftId: string) => {
      return (await this.contract('FEED').maturityDate(nftId)).toBN()
    }

    setDiscountRate = async (rate: string) => {
      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      return this.pending(
        this.contract('FEED').file(web3.fromAscii('discountRate').padEnd(66, '0'), rate, this.overrides)
      )
    }

    updateNftFeed = async (nftId: string, value: string, riskGroup?: string) => {
      if (!riskGroup) {
        return this.pending(this.contract('FEED')['update(bytes32,uint256)'](nftId, value, this.overrides))
      }
      return this.pending(
        this.contract('FEED')['update(bytes32,uint256,uint256)'](nftId, value, riskGroup, this.overrides)
      )
    }
    setMaturityDate = async (nftId: string, timestampSecs: number) => {
      return this.pending(
        this.contract('FEED').file(web3.fromAscii('maturityDate').padEnd(66, '0'), nftId, timestampSecs)
      )
    }
  }
}

export type IAdminActions = {
  isWard(user: string, contractName: ContractName): Promise<BN>
  canUpdateNftFeed(user: string): Promise<boolean>
  canSetRiskScore(user: string): Promise<boolean>
  canSetSeniorTrancheInterest(user: string): Promise<boolean>
  canSetMinimumJuniorRatio(user: string): Promise<boolean>
  canAddToJuniorMemberList(user: string): Promise<boolean>
  canAddToSeniorMemberList(user: string): Promise<boolean>
  updateJuniorMemberList(user: string, validUntil: number): Promise<PendingTransaction>
  updateSeniorMemberList(user: string, validUntil: number): Promise<PendingTransaction>
  canSetLoanPrice(user: string): Promise<boolean>
  setMinimumJuniorRatio(amount: string): Promise<PendingTransaction>
  setMaximumJuniorRatio(amount: string): Promise<PendingTransaction>
  setMaximumReserve(amount: string): Promise<PendingTransaction>
  setSeniorTrancheInterest(amount: string): Promise<PendingTransaction>
  setDiscountRate(amount: string): Promise<PendingTransaction>
  setMaturityDate(nftId: string, timestampSecs: number): Promise<PendingTransaction>
  updateNftFeed(nftId: string, value: string, riskGroup?: string): Promise<PendingTransaction>
  getNftFeedId(registry: string, tokenId: string): Promise<string>
  getNftFeedValue(tokenId: string): Promise<BN>
  getNftMaturityDate(tokenId: string): Promise<BN>
}

export default AdminActions
