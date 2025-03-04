import { AssetTransactionType, InvestorTransactionType, Pool, Token, TokenBalance } from '@centrifuge/centrifuge-js'
import { Network, formatBalance, useGetExplorerUrl } from '@centrifuge/centrifuge-react'
import { AnchorButton, Box, Button, Grid, IconDownload, IconExternalLink, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Column, DataTable, SortableTableHeader } from '../../components/DataTable'
import { TransactionTypeChip } from '../../components/Portfolio/TransactionTypeChip'
import { formatDate } from '../../utils/date'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { usePools, useTransactionsByAddress } from '../../utils/usePools'

type TransactionsProps = {
  onlyMostRecent?: boolean
  narrow?: boolean
  txTypes?: InvestorTransactionType[]
  address?: string
  trancheId?: string
  title?: string
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

export function TransactionHistory({ address }: TransactionsProps) {
  const explorer = useGetExplorerUrl()
  const [expandTable, setExpandTable] = React.useState(false)

  const columns = [
    {
      align: 'left',
      header: <SortableTableHeader label="Transaction date" />,
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
    {
      align: 'left',
      header: 'Transaction',
      width: '200px',
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
      header: <SortableTableHeader label="Price" />,
      cell: ({ tranchePrice, pool }: Row) => (
        <Text as="span" variant="body3">
          {typeof tranchePrice === 'string' ? tranchePrice : formatBalance(tranchePrice, pool?.currency.symbol, 4)}
        </Text>
      ),
      sortKey: 'tranchePrice',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Quantity" />,
      cell: ({ amount }: Row) => (
        <Text as="span" variant="body3">
          {formatBalance(amount.toDecimal())}
        </Text>
      ),
      sortKey: 'amount',
    },
    {
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
      width: '120px',
    },
  ].filter(Boolean) as Column[]

  const { data: transactions } = useTransactionsByAddress(address)
  const pools = usePools()
  const investorTransactions = React.useMemo(() => {
    const txs = transactions?.investorTransactions.map((tx) => {
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
  }, [transactions?.investorTransactions, pools])

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

  return address && investorTransactions?.length ? (
    <Stack gap={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Text variant="heading4">Transaction history</Text>
        <Grid gridTemplateColumns={['1fr', '120px 1fr']} gap={1}>
          {investorTransactions.length > 3 && (
            <Button onClick={() => setExpandTable(!expandTable)} variant="inverted" small>
              {expandTable ? 'Show less' : 'View all'}
            </Button>
          )}
          {csvUrl && (
            <AnchorButton
              small
              variant="inverted"
              href={csvUrl}
              download={`transaction-history-${address}.csv`}
              icon={<IconDownload size="iconSmall" />}
            >
              Download
            </AnchorButton>
          )}
        </Grid>
      </Box>
      <Box overflow="auto" width="100%">
        <DataTable data={expandTable ? investorTransactions : investorTransactions.slice(0, 3)} columns={columns} />
      </Box>
    </Stack>
  ) : (
    <Shelf borderRadius="4px" backgroundColor="backgroundSecondary" justifyContent="center" p="10px">
      <Text color="textSecondary" variant="body2">
        No transactions displayed yet
      </Text>
    </Shelf>
  )
}
