import { Loan } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { BigNumber } from 'ethers'
import { useQuery } from 'react-query'
import { Pool } from '../config'
import { Call, multicall } from './multicall'

const toBN = (val: BigNumber) => new BN(val.toString())

const CONTRACTS_WITH_WRITEOFFS_METHOD = [
  '0xfc2950dd337ca8496c18dfc0256fb905a7e7e5c6',
  '0xdb9a84e5214e03a4e5dd14cfb3782e0bcd7567a7',
  '0x69504da6b2cd8320b9a62f3aed410a298d3e7ac6',
  '0x1621b607a62dac0dc2e4044ff1235a30f135cbd2',
  '0xcab9ed8e5ef4607a97f4e22ad1d984adb93ce890',
  '0x41fad1eb242de19da0206b0468763333bb6c2b3d',
  '0x2cc23f2c2451c55a2f4da389bc1d246e1cf10fc6',
  '0x468eb2408c6f24662a291892550952eb0d70b707',
]

export function useAssetListWriteOffStatus(loans: Loan[], addresses: Pool['addresses']) {
  return useQuery(['loansWithWriteOffStatus', addresses.ROOT_CONTRACT], async () => {
    try {
      const feedContractAddress = addresses.FEED as string
      const pileContractAddress = addresses.PILE as string

      const rateGroupCalls: Call[] = loans.map((loan) => ({
        target: pileContractAddress,
        call: ['loanRates(uint256)(uint256)', loan.loanId],
        returns: [[loan.loanId, toBN]],
      }))

      const rateGroups = (await multicall(rateGroupCalls)) as { [key: string]: BN }

      const rateGroupsWithLoanId = Object.entries(rateGroups).map(([loanId, rateGroup]) => ({
        rateGroup,
        loanId,
      }))

      if (CONTRACTS_WITH_WRITEOFFS_METHOD.includes(feedContractAddress.toLowerCase())) {
        const writeOffCalls: Call[] = rateGroupsWithLoanId
          .filter(({ rateGroup }) => rateGroup.gte(new BN(1000)))
          .map(({ rateGroup, loanId }) => ({
            target: feedContractAddress,
            call: ['writeOffs(uint256)(uint256,uint256)', rateGroup.sub(new BN(1000)).toString()],
            returns: [[''], [loanId, toBN]],
          }))

        const writeOffs = (await multicall(writeOffCalls)) as { [key: string]: BN }

        const writeOffsWithLoanId = Object.entries(writeOffs)
          .filter(([loanId]) => loanId)
          .map(([loanId, writeOffPercentage]) => ({
            loanId,
            writeOffPercentage,
          }))
          .reduce<Record<string, BN>>((acc, { loanId, writeOffPercentage }) => {
            acc[loanId] = new BN(10)
              .pow(new BN(27))
              .sub(new BN(writeOffPercentage.toString()))
              .div(new BN(10).pow(new BN(25)))
            return acc
          }, {})

        return loans.map((loan) => ({
          ...loan,
          status: writeOffsWithLoanId[loan.loanId]?.eq(new BN(100)) ? 'repaid' : loan.status,
        }))
      }

      const writeOffGroupCalls: Call[] = Array.from(Array(100).keys()).map((index) => ({
        target: feedContractAddress,
        call: ['writeOffGroups(uint256)(uint128)', index],
        returns: [[index.toString(), toBN]],
      }))

      const writeOffGroups = await multicall(writeOffGroupCalls)

      const loansWithWriteOffPercentages = rateGroupsWithLoanId
        .map((rateGroup) => {
          return {
            ...rateGroup,
            writeOffPercentage: rateGroup.rateGroup.gte(new BN(1000))
              ? (
                  Object.entries(writeOffGroups).find(([writeOffGroup]) =>
                    rateGroup.rateGroup.eq(new BN(writeOffGroup).add(new BN(1000)))
                  ) as [string, BN]
                )[1]
              : new BN(0),
          }
        })
        .reduce<Record<string, BN>>((acc, { loanId, writeOffPercentage, rateGroup }) => {
          acc[loanId] = rateGroup.gte(new BN(1000))
            ? new BN(10)
                .pow(new BN(27))
                .sub(new BN(writeOffPercentage.toString()))
                .div(new BN(10).pow(new BN(25)))
            : new BN(0)
          return acc
        }, {})

      return loans.map((loan) => ({
        ...loan,
        status: loansWithWriteOffPercentages[loan.loanId]?.eq(new BN(100)) ? 'repaid' : loan.status,
      }))
    } catch (e) {
      return loans
    }
  })
}
