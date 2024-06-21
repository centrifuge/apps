import { AssetTransactionType, InvestorTransactionType, Pool, Token, TokenBalance } from '@centrifuge/centrifuge-js'
import { Network, formatBalance, useGetExplorerUrl } from '@centrifuge/centrifuge-react'
import {
  AnchorButton,
  Box,
  IconExternalLink,
  IconEye,
  Pagination,
  PaginationProvider,
  Shelf,
  Stack,
  Text,
  usePagination,
} from '@centrifuge/fabric'
import * as React from 'react'
import { TransactionTypeChip } from '../../components/Portfolio/TransactionTypeChip'
import { formatDate } from '../../utils/date'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { usePools, useTransactionsByAddress } from '../../utils/usePools'
import { Column, DataTable, SortableTableHeader } from '../DataTable'
import { RouterLinkButton } from '../RouterLinkButton'

type TransactionsProps = {
  onlyMostRecent?: boolean
  narrow?: boolean
  txTypes?: InvestorTransactionType[]
  address?: string
  trancheId?: string
}

type Row = {
  action: InvestorTransactionType | AssetTransactionType
  date: number
  tranche?: Token
  tranchePrice: number | string
  amount: TokenBalance
  hash: string
  pool?: Pool
  poolId: string
  trancheId: string
  network: Network
}

export function Transactions({ onlyMostRecent, narrow, txTypes, address, trancheId }: TransactionsProps) {
  const explorer = useGetExplorerUrl()
  const columns = [
    {
      align: 'left',
      header: 'Action',
      cell: ({ action, tranche, pool, amount }: Row) => (
        <TransactionTypeChip
          type={action as InvestorTransactionType}
          trancheTokenSymbol={tranche?.currency.symbol ?? ''}
          poolCurrencySymbol={pool?.currency.symbol ?? ''}
          currencyAmount={amount.toFloat()}
        />
      ),
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Date" />,
      cell: ({ date }: Row) => (
        <Text as="time" variant="body3" datetime={date}>
          {formatDate(date, {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })}
        </Text>
      ),
      sortKey: 'date',
    },
    !narrow && {
      align: 'left',
      header: 'Token',
      cell: ({ tranche }: Row) => (
        <Text as="span" variant="body3" textOverflow="ellipis">
          {tranche?.currency.symbol} - ({tranche?.currency.name})
        </Text>
      ),
    },
    {
      align: 'right',
      header: 'Token price',
      cell: ({ tranche, tranchePrice, pool }: Row) => (
        <Text as="span" variant="body3">
          {typeof tranchePrice === 'string' ? tranchePrice : formatBalance(tranchePrice, pool?.currency.symbol, 4)}
        </Text>
      ),
    },
    {
      align: 'right',
      header: 'Amount',
      cell: ({ amount, tranche, action, pool }: Row) => (
        <Text as="span" variant="body3">
          {formatBalance(
            amount.toDecimal(),
            ['INVEST_ORDER_UPDATE', 'INVEST_ORDER_CANCEL', 'INVEST_EXECUTION', 'REDEEM_COLLECT'].includes(action)
              ? pool?.currency.symbol
              : tranche?.currency.symbol || ''
          )}
        </Text>
      ),
    },
    !narrow && {
      align: 'center',
      header: 'View transaction',
      cell: ({ hash, network }: Row) => {
        return (
          <Stack
            as="a"
            href={explorer.tx(hash, network)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Transaction on Subscan.io"
          >
            <IconExternalLink size="iconSmall" color="textPrimary" />
          </Stack>
        )
      },
    },
  ].filter(Boolean) as Column[]

  const transactions = useTransactionsByAddress(address)
  const pools = usePools()
  const investorTransactions = React.useMemo(() => {
    const txs = transactions?.investorTransactions
      .filter((tx) => (txTypes ? txTypes?.includes(tx.type) : tx))
      .filter((tx) => (trancheId ? tx.trancheId === trancheId : tx))
      .slice(0, onlyMostRecent ? 3 : transactions?.investorTransactions.length)
      .map((tx) => {
        const pool = pools?.find((pool) => pool.id === tx.poolId)
        const tranche = pool?.tranches.find((tranche) => tranche.id === tx.trancheId)
        return {
          date: new Date(tx.timestamp).getTime(),
          action: tx.type,
          tranche,
          tranchePrice: !tx?.tokenPrice || tx?.tokenPrice.isZero() ? '-' : tx.tokenPrice.toFloat(),
          amount: ['INVEST_ORDER_UPDATE', 'INVEST_ORDER_CANCEL', 'INVEST_EXECUTION', 'REDEEM_COLLECT'].includes(tx.type)
            ? tx.currencyAmount
            : tx.tokenAmount,
          network: ['TRANSFER_IN', 'TRANSFER_OUT', 'INVEST_LP_COLLECT', 'REDEEM_LP_COLLECT'].includes(tx.type)
            ? Number(tx.account.chainId)
            : 'centrifuge',
          hash: tx.hash,
          poolId: tx.poolId,
          pool,
          trancheId: tx.trancheId,
        } satisfies Row
      })
    return txs
  }, [transactions?.investorTransactions, onlyMostRecent, txTypes, pools, trancheId])

  const csvData = React.useMemo(() => {
    if (!investorTransactions || !investorTransactions?.length) {
      return undefined
    }
    return investorTransactions.map((entry) => {
      const pool = pools?.find((pool) => pool.id === entry.poolId)
      return {
        'Transaction date': `"${formatDate(entry.date)}"`,
        Action: entry.action,
        Token: (pool && pool.tranches.find(({ id }) => id === entry.trancheId)?.currency.name) ?? '',
        Amount: (pool && `"${formatBalance(entry.amount.toDecimal(), pool.currency.symbol)}"`) ?? '',
      }
    })
  }, [investorTransactions, pools])

  const csvUrl = React.useMemo(() => csvData && getCSVDownloadUrl(csvData), [csvData])

  const pagination = usePagination({ data: investorTransactions, pageSize: onlyMostRecent ? 3 : 15 })

  return address && investorTransactions?.length ? (
    <PaginationProvider pagination={pagination}>
      <Stack gap={2}>
        <Box overflow="auto" width="100%">
          <DataTable
            data={investorTransactions}
            columns={columns}
            pageSize={pagination.pageSize}
            page={pagination.page}
          />
        </Box>
        {onlyMostRecent ? (
          <Box display="inline-block">
            <RouterLinkButton to={`/history/${address}`} small variant="tertiary" icon={IconEye}>
              View all
            </RouterLinkButton>
          </Box>
        ) : (
          <Shelf justifyContent="space-between">
            {pagination.pageCount > 1 && (
              <Shelf>
                <Pagination />
              </Shelf>
            )}
            {csvUrl && (
              <Box style={{ gridColumn: columns.length, justifySelf: 'end' }}>
                <AnchorButton small variant="secondary" href={csvUrl} download={`transaction-history-${address}.csv`}>
                  Export as CSV
                </AnchorButton>
              </Box>
            )}
          </Shelf>
        )}
      </Stack>
    </PaginationProvider>
  ) : (
    <Shelf borderRadius="4px" backgroundColor="backgroundSecondary" justifyContent="center" p="10px">
      <Text color="textSecondary" variant="body2">
        No transactions displayed yet
      </Text>
    </Shelf>
  )
}
