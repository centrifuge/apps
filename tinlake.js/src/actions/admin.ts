import BN from 'bn.js'
import ethers from 'ethers'
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

    isPoolAdmin = async (user: string) => {
      if (!this.contract('POOL_ADMIN')) return false
      return (await this.toBN(this.contract('POOL_ADMIN').admins(user))).toNumber() === 1
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
      const maxSeniorRatio = new BN(10).pow(new BN(27)).sub(new BN(ratio))

      if (this.contracts['POOL_ADMIN']) {
        return this.pending(this.contract('POOL_ADMIN').setMaxSeniorRatio(maxSeniorRatio))
      }

      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      return this.pending(
        this.contract('ASSESSOR').file(
          web3.fromAscii('maxSeniorRatio').padEnd(66, '0'),
          maxSeniorRatio.toString(),
          this.overrides
        )
      )
    }

    setMaximumJuniorRatio = async (ratio: string) => {
      const minSeniorRatio = new BN(10).pow(new BN(27)).sub(new BN(ratio))

      if (this.contracts['POOL_ADMIN']) {
        return this.pending(this.contract('POOL_ADMIN').setMinSeniorRatio(minSeniorRatio))
      }

      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      return this.pending(
        this.contract('ASSESSOR').file(
          web3.fromAscii('minSeniorRatio').padEnd(66, '0'),
          minSeniorRatio.toString(),
          this.overrides
        )
      )
    }

    setMaximumReserve = async (value: string) => {
      const adminContract = this.contractAddresses.POOL_ADMIN
        ? this.contract('POOL_ADMIN')
        : this.contract('ASSESSOR_ADMIN')
      return this.pending(adminContract.setMaxReserve(value, this.overrides))
    }

    raiseCreditline = async (amount: string) => {
      return this.pending(this.contract('POOL_ADMIN').raiseCreditline(amount, { ...this.overrides, gasLimit: 600000 }))
    }

    sinkCreditline = async (amount: string) => {
      return this.pending(this.contract('POOL_ADMIN').sinkCreditline(amount, { ...this.overrides, gasLimit: 600000 }))
    }

    setSeniorTrancheInterest = async (value: string) => {
      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      return this.pending(
        this.contract('ASSESSOR').file(web3.fromAscii('seniorInterestRate').padEnd(66, '0'), value, this.overrides)
      )
    }

    updateJuniorMemberList = async (user: string, validUntil: number) => {
      if (this.contracts['POOL_ADMIN']) {
        return this.pending(this.contract('POOL_ADMIN').updateJuniorMember(user, validUntil, this.overrides))
      }
      return this.pending(this.contract('JUNIOR_MEMBERLIST').updateMember(user, validUntil, this.overrides))
    }

    updateSeniorMemberList = async (user: string, validUntil: number) => {
      if (this.contracts['POOL_ADMIN']) {
        return this.pending(this.contract('POOL_ADMIN').updateSeniorMember(user, validUntil, this.overrides))
      }
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
      return this.pending(this.contract('POOL_ADMIN').setDiscountRate(rate, this.overrides))
    }

    setSeniorInterestRate = async (rate: string) => {
      return this.pending(this.contract('POOL_ADMIN').setSeniorInterestRate(rate, this.overrides))
    }

    setMinimumEpochTime = async (value: number) => {
      return this.pending(this.contract('POOL_ADMIN').setMinimumEpochTime(value, this.overrides))
    }

    setChallengeTime = async (value: number) => {
      return this.pending(this.contract('POOL_ADMIN').setChallengeTime(value, this.overrides))
    }

    updateNftFeed = async (nftId: string, value: string, riskGroup?: string) => {
      if (!riskGroup) {
        return this.pending(this.contract('POOL_ADMIN').updateNFTValue(nftId, value, this.overrides))
      }
      return this.pending(this.contract('POOL_ADMIN').updateNFTValueRisk(nftId, value, riskGroup, this.overrides))
    }

    setMaturityDate = async (nftId: string, timestampSecs: number) => {
      return this.pending(this.contract('POOL_ADMIN').updateNFTMaturityDate(nftId, timestampSecs, this.overrides))
    }

    addRiskGroups = async (riskGroups: IRiskGroup[]) => {
      return this.pending(
        this.contract('POOL_ADMIN').addRiskGroups(
          riskGroups.map((g) => g.id),
          riskGroups.map((g) => g.thresholdRatio.toString()),
          riskGroups.map((g) => g.ceilingRatio.toString()),
          riskGroups.map((g) => g.rate.toString()),
          riskGroups.map((g) => g.recoveryRatePD.toString()),
          this.overrides
        )
      )
    }

    addWriteOffGroups = async (writeOffGroups: IWriteOffGroup[]) => {
      return this.pending(
        this.contract('POOL_ADMIN').addWriteOffGroups(
          writeOffGroups.map((g) => g.rate.toString()),
          writeOffGroups.map((g) => g.writeOffPercentage.toString()),
          writeOffGroups.map((g) => g.overdueDays.toString()),
          this.overrides
        )
      )
    }

    getWriteOffGroups = async (): Promise<IWriteOffGroup[]> => {
      const navFeed = this.contract('FEED')
      const groups: IWriteOffGroup[] = []
      let i = 0
      const maxWriteOffGroups = 100
      while (i < maxWriteOffGroups) {
        try {
          const group = await navFeed.writeOffGroups(i)
          groups.push(group)
          i += 1
        } catch (e) {
          console.log(`Oops: ${e}`)
          return groups
        }
      }
      return groups
    }

    getWriteOffPercentage = async (rateGroup: BN): Promise<BN> => {
      const navFeed = this.contract('FEED')

      if (navFeed.writeOffs) {
        const writeOffGroup = rateGroup.sub(new BN(1000))
        const { percentage } = await navFeed.writeOffs(writeOffGroup.toString())

        return new BN(10).pow(new BN(27)).sub(new BN(percentage.toString()))
      } else if (navFeed.writeOffGroups) {
        const writeOffGroups = await this.getWriteOffGroups()

        const writeOffGroup = writeOffGroups.find((group) => rateGroup.eq(group.rate))

        if (writeOffGroup) {
          const writeOffPercentage = new BN(10).pow(new BN(27)).sub(writeOffGroup.writeOffPercentage) || new BN(0)

          return writeOffPercentage
        }

        return new BN(0)
      }

      return new BN(0)
    }

    getRateGroup = async (loanId: number) => {
      return await this.toBN(this.contract('PILE').loanRates(loanId))
    }

    writeOff = async (loanId: number) => {
      return this.pending(this.contract('FEED').writeOff(loanId, this.overrides))
    }

    closePool = async () => {
      return this.pending(this.contract('POOL_ADMIN').closePool(this.overrides))
    }

    unclosePool = async () => {
      return this.pending(this.contract('POOL_ADMIN').unclosePool(this.overrides))
    }

    getAuditLog = async (ignoredEvents: string[]): Promise<IAuditLog> => {
      const poolAdmin = this.contract('POOL_ADMIN')
      const eventFilter = {
        address: poolAdmin.address,
        fromBlock: this.provider.getBlockNumber().then((b) => b - 10000),
        toBlock: 'latest',
      }
      const events = (await poolAdmin.queryFilter(eventFilter))
        .filter((e) => e !== undefined)
        .filter((e) => e.event && !ignoredEvents.includes(e.event))
        .reverse()

      const logs = events.map((event) => {
        return poolAdmin.interface.parseLog(event)
      })

      const transactions = await Promise.all(events.map((e) => e.getTransaction()))
      const blocks = await Promise.all(events.map((e) => e.getBlock()))

      return { events, logs, transactions, blocks }
    }
  }
}

export type IRiskGroup = {
  id: number
  ceilingRatio: BN
  thresholdRatio: BN
  rate: BN
  recoveryRatePD: BN
}

export type IWriteOffGroup = {
  rate: BN
  writeOffPercentage: BN
  overdueDays: BN
}

export type IAuditLog = {
  events: ethers.Event[]
  logs: ethers.utils.LogDescription[]
  transactions: ethers.providers.TransactionResponse[]
  blocks: ethers.providers.Block[]
}

export type IAdminActions = {
  isWard(user: string, contractName: ContractName): Promise<BN>
  isPoolAdmin(user: string): Promise<boolean>
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
  raiseCreditline(amount: string): Promise<PendingTransaction>
  sinkCreditline(amount: string): Promise<PendingTransaction>
  setSeniorTrancheInterest(amount: string): Promise<PendingTransaction>
  setDiscountRate(rate: string): Promise<PendingTransaction>
  setSeniorInterestRate(rate: string): Promise<PendingTransaction>
  setMinimumEpochTime(value: number): Promise<PendingTransaction>
  setChallengeTime(value: number): Promise<PendingTransaction>
  setMaturityDate(nftId: string, timestampSecs: number): Promise<PendingTransaction>
  updateNftFeed(nftId: string, value: string, riskGroup?: string): Promise<PendingTransaction>
  getNftFeedId(registry: string, tokenId: string): Promise<string>
  getNftFeedValue(tokenId: string): Promise<BN>
  getNftMaturityDate(tokenId: string): Promise<BN>
  addRiskGroups(riskGroups: IRiskGroup[]): Promise<PendingTransaction>
  addWriteOffGroups(writeOffGroups: IWriteOffGroup[]): Promise<PendingTransaction>
  getAuditLog(ignoredEvents: string[]): Promise<IAuditLog>
  getWriteOffGroups(): Promise<IWriteOffGroup[]>
  getWriteOffPercentage(rateGroup: BN): Promise<BN>
  writeOff(loanId: number): Promise<PendingTransaction>
  getRateGroup(loanId: number): Promise<BN>
  closePool(): Promise<PendingTransaction>
  unclosePool(): Promise<PendingTransaction>
}

export default AdminActions
