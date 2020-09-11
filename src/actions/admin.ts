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
        !!this.contract('SENIOR_OPERATOR')?.wards
      )
    }

    isWard = async (user: string, contractName: ContractName) => {
      if (!this.contract(contractName)?.wards) return new BN(0)
      return (await this.contract(contractName).wards(user)).toBN()
    }

    canSetSeniorTrancheInterest = async (user: string) => {
      if (!this.contract('ASSESSOR')?.wards) return false
      return (await this.contract('ASSESSOR').wards(user)).toBN().toNumber() === 1
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
      return this.pending(
        this.contract('ASSESSOR').file(web3.fromAscii('maxSeniorRatio').padEnd(66, '0'), ratio, this.overrides)
      )
    }

    setMaximumJuniorRatio = async (ratio: string) => {
      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      return this.pending(
        this.contract('ASSESSOR').file(web3.fromAscii('minSeniorRatio').padEnd(66, '0'), ratio, this.overrides)
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

    setDiscountRate = async (rate: string) => {
      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      return this.pending(
        this.contract('FEED').file(web3.fromAscii('discountRate').padEnd(66, '0'), rate, this.overrides)
      )
    }

    // TODO: setMaturityDate (maybe not needed for MVP)
    setMaturityDate = async (ratio: string) => {
    }

    updateJuniorMemberList = async (user: string, validUntil: number) => {
      return this.pending(this.contract('JUNIOR_MEMBERLIST')['updateMember(address,uint)'](user, validUntil, this.overrides))

    }

    updateSeniorMemberList = async (user: string, validUntil: number) => {
      return this.pending(this.contract('SENIOR_MEMBERLIST')['updateMember(address,uint)'](user, validUntil, this.overrides))

    }

    updateNftFeed = async (tokenId: string, value: number, riskGroup?: number) => {
      if (!riskGroup) {
        return this.pending(this.contract('FEED')['update(bytes32,uint256)'](tokenId, value, this.overrides))
      } 
        return this.pending(this.contract('FEED')['update(bytes32,uint256,uint256)'](tokenId, value, riskGroup, this.overrides))
      
    }

    getNftFeedId = async (registry: string, tokenId: number) => {
      return await this.contract('FEED')['nftID(address,uint256)'](registry, tokenId)
    }

    getNftFeedValue = async (nftFeedId: string) => {
      return (await this.contract('FEED').nftValues(nftFeedId)).toBN()
    }
  }
}

export type IAdminActions = {
  isWard(user: string, contractName: ContractName): Promise<BN>
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
  updateNftFeed(nftId: string, value: number, riskGroup?: number): Promise<PendingTransaction>
  getNftFeedId(registry: string, tokenId: number): Promise<any>
  getNftFeedValue(tokenId: string): Promise<BN>
}

export default AdminActions
