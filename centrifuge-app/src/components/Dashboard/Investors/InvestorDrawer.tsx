import { Drawer, IconClock, IconExternalLink, IconFreeze, IconStop, Stack } from '@centrifuge/fabric'

import { CurrencyBalance, evmToSubstrateAddress, Price, TokenBalance } from '@centrifuge/centrifuge-js'
import {
  formatBalance,
  NetworkIcon,
  useCentrifuge,
  useCentrifugeTransaction,
  useGetExplorerUrl,
  useGetNetworkName,
} from '@centrifuge/centrifuge-react'
import {
  Box,
  Divider,
  IconCopy,
  IconMoreVertical,
  Menu,
  MenuItem,
  Popover,
  Shelf,
  Text,
  truncate,
} from '@centrifuge/fabric'
import { switchMap } from 'rxjs'
import { Column, DataTable } from '../../../components/DataTable'
import { formatInvestorTransactionsType } from '../../../components/Report/utils'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { copyToClipboard } from '../../../utils/copyToClipboard'
import { formatDate } from '../../../utils/date'
import { useLiquidityPoolRestrictions } from '../../../utils/useLiquidityPools'
import { usePermissions, usePoolAdmin } from '../../../utils/usePermissions'
import { usePool, usePools, useTransactionsByAddress } from '../../../utils/usePools'
import { InvestorTableRow } from './InvestorTable'

export function InvestorDrawer({
  isOpen,
  onClose,
  investor,
}: {
  isOpen: boolean
  onClose: () => void
  investor: InvestorTableRow
}) {
  const cent = useCentrifuge()
  const { data: restrictions } = useLiquidityPoolRestrictions(
    investor.poolId,
    investor.trancheId,
    investor.network,
    investor.wallet
  )
  const pool = usePool(investor.poolId)
  const getNetworkName = useGetNetworkName()
  const investorWallet =
    investor.network === 0 ? investor.wallet : evmToSubstrateAddress(investor.wallet, investor.network)
  const permissions = usePermissions(investorWallet)

  // only for LP: freeze is pending if isFrozen is true in the substrate chain permissions but is false in the evm restrictions
  const isLPFreezePending =
    investor.network !== 0 &&
    permissions?.pools[investor.poolId]?.tranches[investor.trancheId]?.isFrozen &&
    !restrictions?.isFrozen

  // only for LP: unfreeze is pending if isFrozen is false in the substrate chain permissions but is true in the evm restrictions
  const isLPUnfreezePending =
    investor.network !== 0 &&
    !permissions?.pools[investor.poolId]?.tranches[investor.trancheId]?.isFrozen &&
    restrictions?.isFrozen

  // only for LP: enable is pending if isFrozen is true in the substrate chain permissions but is false in the evm restrictions
  const isLPEnablePending =
    investor.network !== 0 &&
    permissions?.pools[investor.poolId]?.tranches[investor.trancheId]?.permissionedTill &&
    !restrictions?.isMember

  // disable doesn't need a pending state since it's subjet to a 7 day delay

  const account = usePoolAdmin(investor.poolId)

  const isDisabled = !!(
    permissions !== undefined &&
    restrictions !== undefined &&
    (investor.network === 0
      ? !permissions?.pools[investor.poolId]?.tranches[investor.trancheId]
      : !restrictions?.isMember)
  )

  const isFrozen = investor.network !== 0 ? restrictions?.isFrozen : false

  const { execute: executeUpdateRoles } = useCentrifugeTransaction(
    'Update investor wallet',
    (cent) => cent.pools.updatePoolRoles
  )

  const { execute: executeFreeze } = useCentrifugeTransaction('Freeze investor wallet', (cent) => (_, options) => {
    return cent.getApi().pipe(
      switchMap((api) => {
        let batch = []
        batch.push(
          api.tx.permissions.add(
            { PoolRole: 'PoolAdmin' },
            evmToSubstrateAddress(investor.wallet, investor.network),
            { Pool: investor.poolId },
            { PoolRole: { FrozenTrancheInvestor: investor.trancheId } }
          )
        )
        if (investor.network === 0) {
          batch.push(
            api.tx.liquidityPools.freezeInvestor(investor.poolId, investor.trancheId, {
              Centrifuge: investor.wallet,
            })
          )
        } else {
          batch.push(
            api.tx.liquidityPools.freezeInvestor(investor.poolId, investor.trancheId, {
              EVM: [investor.network, investor.wallet],
            })
          )
        }
        const submittable = api.tx.utility.batchAll(batch)
        return cent.wrapSignAndSend(api, submittable, options)
      })
    )
  })

  const { execute: executeUnfreeze } = useCentrifugeTransaction('Unfreeze investor wallet', (cent) => (_, options) => {
    return cent.getApi().pipe(
      switchMap((api) => {
        let batch = []
        batch.push(
          api.tx.permissions.remove(
            { PoolRole: 'PoolAdmin' },
            evmToSubstrateAddress(investor.wallet, investor.network),
            { Pool: investor.poolId },
            { PoolRole: { FrozenTrancheInvestor: investor.trancheId } }
          )
        )
        if (investor.network === 0) {
          batch.push(
            api.tx.liquidityPools.unfreezeInvestor(investor.poolId, investor.trancheId, {
              Centrifuge: investor.wallet,
            })
          )
        } else {
          batch.push(
            api.tx.liquidityPools.unfreezeInvestor(investor.poolId, investor.trancheId, {
              EVM: [investor.network, investor.wallet],
            })
          )
        }
        const submittable = api.tx.utility.batchAll(batch)
        return cent.wrapSignAndSend(api, submittable, options)
      })
    )
  })

  function handleDisable() {
    const SevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const SevenDaysFromNow = Math.floor((Date.now() + SevenDaysMs) / 1000)
    // remove TrancheInvestor permission for tranche
    executeUpdateRoles(
      [investor.poolId, [], [[investorWallet, { TrancheInvestor: [investor.trancheId, SevenDaysFromNow] }]]],
      {
        account,
      }
    )
  }

  function handleEnable() {
    const OneHundredYearsFromNow = Math.floor(Date.now() / 1000 + 10 * 365 * 24 * 60 * 60)
    // add TrancheInvestor permission for tranche
    executeUpdateRoles(
      [investor.poolId, [[investorWallet, { TrancheInvestor: [investor.trancheId, OneHundredYearsFromNow] }]], []],
      {
        account,
      }
    )
  }

  const columns: Column[] = [
    {
      header: (
        <Shelf gap={1}>
          1. Wallet{' '}
          {isFrozen ? (
            <Shelf gap={'4px'}>
              <IconFreeze size="iconSmall" color="#FF0000" />
              Frozen
            </Shelf>
          ) : isDisabled ? (
            <Shelf gap={'4px'}>
              <IconStop size="iconSmall" color="#FF6600" />
              Disabled
            </Shelf>
          ) : null}
        </Shelf>
      ),
      align: 'left',
      cell: (row) => (
        <Text variant="body3" fontWeight="400">
          {row.firstColumn}
        </Text>
      ),
      width: '40%',
    },
    {
      header: truncate(investor.wallet),
      align: 'left',
      cell: (row) => (
        <Text variant="body3" fontWeight="600">
          {row.secondColumn}
        </Text>
      ),
      width: '50%',
    },
    {
      header: (
        <Popover
          renderTrigger={(props, ref) => (
            <Box ref={ref}>
              <Box
                border="none"
                display="flex"
                alignItems="center"
                justifyContent="center"
                backgroundColor="transparent"
                as="button"
                style={{
                  cursor: 'pointer',
                }}
                {...props}
              >
                <IconMoreVertical size="iconSmall" />
              </Box>
            </Box>
          )}
          renderContent={(props, ref, state) => (
            <Box ref={ref} {...props} width="200px">
              <Menu backgroundColor="white">
                {isDisabled ? (
                  <MenuItem
                    label={isLPEnablePending ? 'Enable (pending)' : 'Enable'}
                    disabled={isLPEnablePending}
                    onClick={() => {
                      handleEnable()
                      state.close()
                    }}
                  />
                ) : (
                  <MenuItem
                    label="Disable"
                    onClick={() => {
                      handleDisable()
                      state.close()
                    }}
                  />
                )}
                {investor.network !== 0 && (
                  <>
                    {isFrozen ? (
                      <MenuItem
                        label={isLPUnfreezePending ? 'Unfreeze (pending)' : 'Unfreeze'}
                        disabled={isLPUnfreezePending}
                        onClick={() => {
                          executeUnfreeze([], { account })
                          state.close()
                        }}
                        iconRight={isLPUnfreezePending ? <IconClock size="iconMedium" /> : undefined}
                      />
                    ) : (
                      <MenuItem
                        label={isLPFreezePending ? 'Freeze (pending)' : 'Freeze'}
                        disabled={isLPFreezePending}
                        onClick={() => {
                          executeFreeze([], { account })
                          state.close()
                        }}
                        iconRight={isLPFreezePending ? <IconClock size="iconMedium" /> : undefined}
                      />
                    )}
                  </>
                )}
                <Divider />
                <MenuItem
                  iconRight={<IconCopy size="iconMedium" />}
                  label="Copy"
                  style={{ cursor: 'copy' }}
                  onClick={() => {
                    copyToClipboard(investor.wallet)
                    state.close()
                  }}
                />
              </Menu>
            </Box>
          )}
        ></Popover>
      ),
      align: 'right',
      cell: () => '',
      width: '10%',
    },
  ]
  const data = [
    {
      firstColumn: 'Network',
      secondColumn: (
        <Shelf gap="4px">
          <NetworkIcon size="iconSmall" network={investor.network || 'centrifuge'} />
          <Text>{getNetworkName(investor.network || 'centrifuge')}</Text>
        </Shelf>
      ),
    },
    {
      firstColumn: 'Investment position',
      secondColumn: formatBalance(investor.holdings, investor.tokenName, 2),
    },
    {
      firstColumn: 'Pending investments',
      secondColumn: formatBalance(investor.pendingInvestments, investor.poolCurrency, 2),
    },
    {
      firstColumn: 'Pending redemptions',
      secondColumn: formatBalance(investor.pendingRedemptions, investor.poolCurrency, 2),
    },
  ]
  if (!investor) return null
  const iconUri = investor.poolIcon?.uri && cent.metadata.parseMetadataUrl(investor.poolIcon?.uri)
  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="37%" innerPaddingTop={2}>
      <Stack gap="18px">
        <Shelf gap={1}>
          <Box as="img" width="iconMedium" height="iconMedium" src={iconUri} borderRadius={1} />
          <Text variant="body2" fontWeight="500">
            {investor.tokenName}
          </Text>
        </Shelf>
        <Divider />
        <Shelf gap={1}>
          <Stack>
            <Text variant="body2" color="textSecondary">
              Realized P&L ({pool.currency.displayName})
            </Text>
            <Text variant="body2" color="textPrimary" fontWeight="600">
              {formatBalance(investor.realizedProfit, undefined, 2)}
            </Text>
          </Stack>
          <Stack>
            <Text variant="body2" color="textSecondary">
              Unrealized P&L ({pool.currency.displayName})
            </Text>
            <Text variant="body2" color="textPrimary" fontWeight="600">
              {formatBalance(investor.unrealizedProfit, undefined, 2)}
            </Text>
          </Stack>
          <Stack>
            <Text variant="body2" color="textSecondary">
              Investor since
            </Text>
            <Text variant="body2" color="textPrimary" fontWeight="600">
              {formatDate(investor.investorSince) || '-'}
            </Text>
          </Stack>
        </Shelf>
        <Divider />
        <Text variant="body2" fontWeight="700">
          Wallet
        </Text>
        <DataTable
          data={data}
          columns={columns}
          headerBackgroundColor={isFrozen ? '#FF000015' : isDisabled ? '#FF660015' : 'backgroundSecondary'}
        />
        <Shelf justifyContent="space-between">
          <Text variant="body2" fontWeight="700">
            Transaction history
          </Text>
          <RouterLinkButton variant="inverted" small to={`/pools/${investor.poolId}/data?address=${investor.wallet}`}>
            View all
          </RouterLinkButton>
        </Shelf>
        <MiniTransactionHistoryTable wallet={investor.wallet} network={investor.network} />
      </Stack>
    </Drawer>
  )
}

type MiniTransactionHistoryRow = {
  date: string
  action: string
  amount: CurrencyBalance | TokenBalance
  currency: string
  txHash: string
  tokenPrice: Price
  tokenCurrency: string
}

const MiniTransactionHistoryTable = ({ wallet, network }: { wallet: string; network: number }) => {
  const { data: transactions } = useTransactionsByAddress(
    network === 0 ? wallet : evmToSubstrateAddress(wallet, network)
  )
  const explorer = useGetExplorerUrl()
  const pools = usePools()
  const columns: Column[] = [
    {
      header: 'Action',
      align: 'left',
      cell: (row: MiniTransactionHistoryRow) => (
        <Stack gap={1} overflow="hidden">
          <Text variant="body3" fontWeight="700" textOverflow="ellipsis">
            {row.action}
          </Text>
          <Text variant="body3" color="textSecondary" textOverflow="ellipsis">
            {formatDate(row.date)}
          </Text>
        </Stack>
      ),
      width: '35%',
    },
    {
      header: 'Token',
      align: 'left',
      cell: (row: MiniTransactionHistoryRow) => (
        <Stack gap={1} overflow="hidden">
          <Text variant="body3" fontWeight="700" textOverflow="ellipsis">
            {row.currency}
          </Text>
          <Text variant="body3" color="textSecondary" textOverflow="ellipsis">
            {formatBalance(row.tokenPrice.toDecimal(), row.tokenCurrency, 6)}
          </Text>
        </Stack>
      ),
      width: '20%',
    },
    {
      header: 'Amount',
      align: 'left',
      width: '30%',
      cell: (row: MiniTransactionHistoryRow) => (
        <Text variant="body3" color="textSecondary" textOverflow="ellipsis">
          {formatBalance(row.amount, row.currency, 2)}
        </Text>
      ),
    },
    {
      header: '',
      align: 'left',
      cell: (row: MiniTransactionHistoryRow) => (
        <Stack
          as="a"
          href={explorer.tx(row.txHash, network)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Transaction on block explorer"
        >
          <IconExternalLink size="iconMedium" color="textPrimary" />
        </Stack>
      ),
      width: '15%',
    },
  ]

  const data: MiniTransactionHistoryRow[] =
    transactions?.investorTransactions.slice(0, 3).map((tx) => {
      const tokenCurrency = pools
        ?.map((pool) => pool.tranches.find((tranche) => tranche.id === tx.trancheId)?.currency.displayName)
        .filter(Boolean)[0]
      const label = formatInvestorTransactionsType({
        type: tx.type,
        trancheTokenSymbol: tokenCurrency || '',
        poolCurrencySymbol: tx.poolCurrency || '',
        currencyAmount: tx.currencyAmount.toFloat(),
      })
      return {
        date: tx.timestamp,
        action: label,
        tokenPrice: tx.tokenPrice,
        tokenCurrency: tokenCurrency || '',
        ...(['INVEST_ORDER_UPDATE', 'INVEST_ORDER_CANCEL', 'INVEST_EXECUTION', 'REDEEM_COLLECT'].includes(tx.type)
          ? { amount: tx.currencyAmount, currency: tx.poolCurrency }
          : { amount: tx.tokenAmount, currency: tokenCurrency || '' }),
        txHash: tx.hash,
      }
    }) ?? []

  return data.length > 0 ? (
    <Box width="100%" maxWidth="100%">
      <DataTable data={data} columns={columns} />
    </Box>
  ) : (
    <Text>No transactions</Text>
  )
}
