import { Drawer, IconExternalLink, IconFreeze, IconStop, Stack } from '@centrifuge/fabric'

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
import { usePermissions } from '../../../utils/usePermissions'
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
  const pool = usePool(investor.poolId)
  const getNetworkName = useGetNetworkName()
  const permissions = usePermissions(investor.wallet)

  const isEnabled = permissions?.pools[investor.poolId]?.tranches[investor.trancheId]
  const isFrozen = false

  const { execute: executeEnable, isLoading: isTransactionPending } = useCentrifugeTransaction(
    'Update investor wallet',
    (cent) => cent.pools.updatePoolRoles
  )

  const { execute: executeFreeze, isLoading: isTransactionPendingFreeze } = useCentrifugeTransaction(
    'Freeze investor wallet',
    (cent) => (args, options) => {
      return cent.getApi().pipe(
        switchMap((api) => {
          const tx = api.tx.liquidityPools.freezeInvestor(
            investor.poolId,
            investor.trancheId,
            { EVM: investor.network },
            0
          )
          return cent.wrapSignAndSend(api, tx, options)
        })
      )
    }
  )

  const { execute: executeUnfreeze, isLoading: isTransactionPendingUnfreeze } = useCentrifugeTransaction(
    'Unfreeze investor wallet',
    (cent) => (args, options) => {
      return cent.getApi().pipe(
        switchMap((api) => {
          const tx = api.tx.liquidityPools.unfreezeInvestor(investor.poolId, investor.trancheId, {
            EVM: investor.network,
          })
          return cent.wrapSignAndSend(api, tx, options)
        })
      )
    }
  )

  function handleFreeze() {
    executeFreeze([investor.poolId, investor.trancheId, { EVM: investor.network }])
  }

  function handleUnfreeze() {
    executeUnfreeze([investor.poolId, investor.trancheId, { EVM: investor.network }])
  }

  function handleDisable() {
    executeEnable([investor.poolId, [], [[investor.wallet, 'InvestorAdmin']]])
  }

  function handleEnable() {
    executeEnable([investor.poolId, [[investor.wallet, 'InvestorAdmin']], []])
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
          ) : !isEnabled ? (
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
          renderContent={(props, ref) => (
            <Box ref={ref} {...props} width="200px">
              <Menu backgroundColor="white">
                {isEnabled ? (
                  <>
                    <MenuItem label="Disable" onClick={handleDisable} />
                  </>
                ) : (
                  <MenuItem label="Enable" onClick={handleEnable} />
                )}
                {isFrozen ? (
                  <MenuItem label="Unfreeze" onClick={handleUnfreeze} />
                ) : (
                  <MenuItem label="Freeze" onClick={handleFreeze} />
                )}
                <Divider />
                <MenuItem
                  iconRight={<IconCopy size="iconMedium" />}
                  label="Copy"
                  style={{ cursor: 'copy' }}
                  onClick={() => copyToClipboard(investor.wallet)}
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
          headerBackgroundColor={isFrozen ? '#FF000015' : !isEnabled ? '#FF660015' : 'backgroundSecondary'}
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
