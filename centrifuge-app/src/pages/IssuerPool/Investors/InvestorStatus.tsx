import { findBalance, Pool, Token } from '@centrifuge/centrifuge-js'
import {
  getChainInfo,
  Network,
  useBalances,
  useCentrifugeTransaction,
  useCentrifugeUtils,
  useWallet,
} from '@centrifuge/centrifuge-react'
import {
  AddressInput,
  Button,
  Grid,
  IconAlertCircle,
  IconCheckCircle,
  IconInfoFailed,
  IconMinus,
  IconPlus,
  Select,
  Shelf,
  Stack,
  Text,
  TextWithPlaceholder,
} from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import { isAddress as isEvmAddress } from 'ethers'
import React, { useMemo } from 'react'
import { useParams } from 'react-router'
import { DataTable } from '../../../components/DataTable'
import { PageSection } from '../../../components/PageSection'
import { useActiveDomains } from '../../../utils/useLiquidityPools'
import { usePermissions, useSuitableAccounts } from '../../../utils/usePermissions'
import { useOrder, usePool } from '../../../utils/usePools'

const SevenDaysMs = (7 * 24 + 1) * 60 * 60 * 1000 // 1 hour margin

export function InvestorStatus() {
  const {
    evm: { chains },
  } = useWallet()
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  const [address, setAddress] = React.useState('')
  const [chain, setChain] = React.useState<number | ''>('')

  const { data: domains } = useActiveDomains(poolId)
  const deployedLpChains = domains?.map((d) => d.chainId) ?? []

  const [pendingTrancheId, setPendingTrancheId] = React.useState('')

  const [account] = useSuitableAccounts({ poolId, poolRole: ['InvestorAdmin'] })

  const { execute, isLoading: isTransactionPending } = useCentrifugeTransaction(
    'Update investor',
    (cent) => cent.pools.updatePoolRoles
  )

  const { allowedTranches, permissions, centAddress, validAddress } = useInvestorStatus(
    poolId,
    address,
    chain || 'centrifuge'
  )

  const pool = usePool(poolId) as Pool

  function toggleAllowed(trancheId: string) {
    if (!centAddress || !validAddress) return
    const isAllowed = allowedTranches.includes(trancheId)
    const OneHundredYearsFromNow = Math.floor(Date.now() / 1000 + 10 * 365 * 24 * 60 * 60)
    const SevenDaysFromNow = Math.floor((Date.now() + SevenDaysMs) / 1000)
    const domains = chain ? [[chain, validAddress]] : undefined

    if (isAllowed) {
      execute([poolId!, [], [[centAddress, { TrancheInvestor: [trancheId, SevenDaysFromNow, domains as any] }]]], {
        account,
      })
    } else {
      execute(
        [poolId!, [[centAddress, { TrancheInvestor: [trancheId, OneHundredYearsFromNow, domains as any] }]], []],
        {
          account,
        }
      )
    }
    setPendingTrancheId(trancheId)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAddress(e.target.value)
  }

  return (
    <PageSection
      title="Investor status"
      subtitle="Display investor status, and add or remove from investor memberlist."
    >
      <Stack gap={2}>
        <Grid columns={2} gap={2} alignItems="center">
          <AddressInput label="" placeholder="Add an address" onChange={handleChange} value={address} />
          <Select
            value={chain}
            options={[
              { value: '', label: 'Centrifuge' },
              ...deployedLpChains.map((chainId) => ({
                value: String(chainId),
                label: getChainInfo(chains, chainId).name,
              })),
            ]}
            onChange={(e) => {
              setChain(Number(e.target.value))
            }}
            disabled={!deployedLpChains.length}
          />
          {address && !validAddress ? (
            <Text variant="label2" color="statusCritical">
              <Shelf gap={1}>
                <IconInfoFailed size="20px" />
                <span>Invalid address</span>
              </Shelf>
            </Text>
          ) : (
            validAddress &&
            (allowedTranches.length ? (
              <Text variant="label2" color="statusOk">
                <Shelf gap={1}>
                  <IconCheckCircle size="20px" />
                  <span>Address added to memberlist</span>
                </Shelf>
              </Text>
            ) : permissions && !allowedTranches.length ? (
              <Text variant="label2" color="statusWarning">
                <Shelf gap={1}>
                  <IconAlertCircle size="20px" />
                  <span>Address not in memberlist</span>
                </Shelf>
              </Text>
            ) : null)
          )}
        </Grid>
        {pool?.tranches && centAddress && permissions && (
          <DataTable
            data={pool.tranches}
            columns={[
              {
                align: 'left',
                header: 'Token',
                cell: (row: Token) => (
                  <Text textOverflow="ellipsis" variant="body2">
                    {row.currency.name}
                  </Text>
                ),
              },
              {
                align: 'left',
                header: 'Investment',
                cell: (row: Token) => <InvestedCell address={centAddress} poolId={poolId} trancheId={row.id} />,
              },
              {
                header: '',
                align: 'right',
                cell: (row: Token) => {
                  const isAllowed = allowedTranches.includes(row.id)

                  return (
                    <Button
                      variant="tertiary"
                      icon={isAllowed ? IconMinus : IconPlus}
                      onClick={() => toggleAllowed(row.id)}
                      loading={isTransactionPending && pendingTrancheId === row.id}
                      small
                      aria-label={isAllowed ? `Remove ${row.id} to memberlist` : `Add ${row.id} to memberlist`}
                    >
                      {isAllowed ? 'Remove from memberlist' : 'Add to memberlist'}
                    </Button>
                  )
                },
              },
            ]}
          />
        )}
      </Stack>
    </PageSection>
  )
}

function InvestedCell({ address, poolId, trancheId }: { address: string; poolId: string; trancheId: string }) {
  const order = useOrder(poolId, trancheId, address)
  const balances = useBalances(address)
  const hasBalance = balances && findBalance(balances.tranches, { Tranche: [poolId, trancheId] })
  const hasOrder = order && (order?.submittedAt > 0 || !order.invest.isZero())
  const hasInvested = hasBalance || hasOrder

  return <TextWithPlaceholder variant="body2">{hasInvested && 'Invested'}</TextWithPlaceholder>
}

export function useInvestorStatus(poolId: string, address: string, network: Network = 'centrifuge') {
  const {
    substrate: { evmChainId: substrateEvmChainId },
  } = useWallet()
  const validator = typeof network === 'number' ? isEvmAddress : isAddress
  const validAddress = validator(address) ? address : undefined
  const utils = useCentrifugeUtils()
  const centAddress =
    validAddress && typeof network === 'number'
      ? utils.evmToSubstrateAddress(address, network)
      : substrateEvmChainId && isEvmAddress(address)
      ? utils.evmToSubstrateAddress(address, substrateEvmChainId)
      : validAddress
  const permissions = usePermissions(centAddress)

  const allowedTranches = useMemo(
    () =>
      Object.entries(permissions?.pools[poolId]?.tranches ?? {})
        .filter(([, till]) => new Date(till).getTime() - Date.now() > SevenDaysMs)
        .map(([tid]) => tid),
    [permissions, poolId]
  )

  return { allowedTranches, permissions, centAddress, validAddress }
}
