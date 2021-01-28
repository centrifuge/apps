import BN from 'bn.js'
import { ZERO_ADDRESS } from '../services/ethereum'
import { Constructor, ContractName, PendingTransaction, TinlakeParams } from '../Tinlake'
const web3 = require('web3-utils')

export function AdminActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IAdminActions {
    canQueryPermissions = () => {
      const isLoadedHasWards = (name: ContractName) => !!this.contractAddresses[name] && !!this.contract(name)?.wards

      return (
        isLoadedHasWards('FEED') &&
        isLoadedHasWards('ASSESSOR') &&
        isLoadedHasWards('ASSESSOR_ADMIN') &&
        isLoadedHasWards('JUNIOR_OPERATOR') &&
        isLoadedHasWards('SENIOR_OPERATOR') &&
        isLoadedHasWards('JUNIOR_MEMBERLIST') &&
        isLoadedHasWards('SENIOR_MEMBERLIST') &&
        isLoadedHasWards('COLLECTOR')
      )
    }

    isWard = async (user: string, contractName: ContractName) => {
      if (!this.contract(contractName)?.wards) return new BN(0)
      return await this.toBN(this.contract(contractName).wards(user))
    }

    canUpdateNftFeed = async (user: string) => {
      if (!this.contract('FEED')?.wards) return false
      return (await this.toBN(this.contract('FEED').wards(user))).toNumber() === 1
    }

    canSetSeniorTrancheInterest = async (user: string) => {
      if (!this.contract('ASSESSOR')?.wards) return false
      return (await this.toBN(this.contract('ASSESSOR').wards(user))).toNumber() === 1
    }

    canSetRiskScore = async (user: string) => {
      if (!this.contract('FEED')?.wards) return false
      return (await this.toBN(this.contract('FEED').wards(user))).toNumber() === 1
    }

    canSetMaxReserve = async (user: string) => {
      if (!this.contract('ASSESSOR_ADMIN')?.wards) return false
      return (await this.toBN(this.contract('ASSESSOR_ADMIN').wards(user))).toNumber() === 1
    }

    canSetMinimumJuniorRatio = async (user: string) => {
      if (!this.contract('ASSESSOR')?.wards) return false
      return (await this.toBN(this.contract('ASSESSOR').wards(user))).toNumber() === 1
    }

    canAddToJuniorMemberList = async (user: string) => {
      if (!this.contract('JUNIOR_MEMBERLIST')?.wards) return false
      return (await this.toBN(this.contract('JUNIOR_MEMBERLIST').wards(user))).toNumber() === 1
    }

    canAddToSeniorMemberList = async (user: string) => {
      if (!this.contract('SENIOR_MEMBERLIST')?.wards) return false
      if (!(this.contractAddresses['SENIOR_MEMBERLIST'] !== ZERO_ADDRESS)) return false
      return (await this.toBN(this.contract('SENIOR_MEMBERLIST').wards(user))).toNumber() === 1
    }

    // REV: not used, but can be left
    canSetLoanPrice = async (user: string) => {
      if (!this.contract('COLLECTOR')?.wards) return false
      return (await this.toBN(this.contract('COLLECTOR').wards(user))).toNumber() === 1
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
      return this.pending(this.contract('ASSESSOR_ADMIN').setMaxReserve(value, this.overrides))
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
      return await this.toBN(this.contract('FEED').nftValues(nftId))
    }

    getNftMaturityDate = async (nftId: string) => {
      return await this.toBN(this.contract('FEED').maturityDate(nftId))
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
        this.contract('FEED')['file(bytes32,bytes32,uint256)'](
          web3.fromAscii('maturityDate').padEnd(66, '0'),
          nftId,
          timestampSecs
        )
      )
    }
  }
}

export type IAdminActions = {
  isWard(user: string, contractName: ContractName): Promise<BN>
  canQueryPermissions(): boolean
  canUpdateNftFeed(user: string): Promise<boolean>
  canSetRiskScore(user: string): Promise<boolean>
  canSetSeniorTrancheInterest(user: string): Promise<boolean>
  canSetMinimumJuniorRatio(user: string): Promise<boolean>
  canSetMaxReserve(user: string): Promise<boolean>
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
