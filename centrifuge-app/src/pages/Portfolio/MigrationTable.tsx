import { CurrencyBalance, isEvm } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils, useGetExplorerUrl } from '@centrifuge/centrifuge-react'
import { Box, IconExternalLink, Text } from '@centrifuge/fabric'
import { formatDateAndTime } from '../../../src/utils/date'
import { formatBalance } from '../../../src/utils/formatting'
import { useMigrationPairs } from '../../../src/utils/usePools'
import { truncate } from '../../../src/utils/web3'
import { DataTable, SortableTableHeader } from '../../components/DataTable'
import { isEvmAddress } from '../../utils/address'

type Migration = {
  sentAmount?: CurrencyBalance
  sentAt?: string
  migrationPairId: string
  receivedAmount?: CurrencyBalance
  receivedAt?: string
  evmAddress?: string
  receivedTxHash?: string
  txHash?: string
  toAccount?: string
  sentTxHash?: string
}

type Row = {
  migrationPairId: string
  receivedAmount: CurrencyBalance
  receivedAt: string
  sentAmount: CurrencyBalance
  sentAt: string
  toAccount: string
  txHash: string
  evmAddress?: string
  accountId?: string
  sentTxHash?: string
  receivedTxHash?: string
}

function mergeMigrations(sentMigrations: Migration[], receivedMigrations: Migration[]): Row[] {
  const map = new Map<string, Partial<Row>>()

  sentMigrations.forEach((sent) => {
    const id = sent.migrationPairId
    const amount = sent.sentAmount?.toString() || '0'
    const key = `${id}:${amount}`

    map.set(key, {
      migrationPairId: id,
      sentAmount: sent.sentAmount,
      sentAt: sent.sentAt,
      sentTxHash: sent.sentTxHash,
      toAccount: sent.toAccount,
      evmAddress: sent.evmAddress,
    })
  })

  receivedMigrations.forEach((rcv) => {
    const id = rcv.migrationPairId
    const amount = rcv.receivedAmount?.toString() || '0'
    const key = `${id}:${amount}`

    const row = map.get(key) ?? { migrationPairId: id }
    Object.assign(row, {
      receivedAmount: rcv.receivedAmount,
      receivedAt: rcv.receivedAt,
      evmAddress: rcv.evmAddress,
      toAccount: rcv.toAccount,
      receivedTxHash: rcv.receivedTxHash,
    })
    map.set(key, row)
  })

  return Array.from(map.values()) as Row[]
}

export const MigrationTable = ({ address }: { address: string }) => {
  const explorer = useGetExplorerUrl()

  const utils = useCentrifugeUtils()
  const migrationPairs = useMigrationPairs(address)
  const { sentMigrations, receivedMigrations } = migrationPairs ?? { sentMigrations: [], receivedMigrations: [] }
  const merged = mergeMigrations(sentMigrations, receivedMigrations)

  const data = merged.map((m) => ({
    ...m,
    migrationPairId: m.migrationPairId,
    sentAmount: m.sentAmount,
    sentAt: m.sentAt,
    receivedAmount: m.receivedAmount,
    receivedAt: m.receivedAt,
    toAccount: m.toAccount,
  }))

  const columns = [
    {
      align: 'left',
      header: 'From address',
      cell: (l: Row) => (
        <Text variant="heading4">{isEvmAddress(address) ? address : truncate(utils.formatAddress(address))}</Text>
      ),
    },
    {
      align: 'left',
      header: 'To address',
      cell: (l: Row) => {
        const address = l.evmAddress ? l.evmAddress : isEvm(l.toAccount) ? '0x' + l.toAccount.slice(2, 42) : l.toAccount
        return <Text variant="heading4">{address}</Text>
      },
      sortKey: 'toAccount',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Sent amount" />,
      cell: (l: Row) => {
        const txUrl = l.sentTxHash ? explorer.tx(l.sentTxHash) : ''
        return (
          <Box display="flex" alignItems="center">
            <Text variant="heading4">{l.sentAmount ? formatBalance(l.sentAmount, 'CFG', 2) : '-'}</Text>
            <Box
              as="a"
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Transaction on block explorer"
              ml={1}
            >
              <IconExternalLink size="iconSmall" color="textPrimary" />
            </Box>
          </Box>
        )
      },
      sortKey: 'sentAmount',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Sent at" />,
      cell: (l: Row) => <Text variant="heading4">{l.sentAt ? formatDateAndTime(l.sentAt) : '-'}</Text>,
      sortKey: 'sentAt',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Received amount" />,
      cell: (l: Row) => {
        const txUrl = l.receivedTxHash ? explorer.tx(l.receivedTxHash, 1) : ''
        if (!l.receivedAmount) return <Text variant="heading4">Pending</Text>
        return (
          <Box display="flex" alignItems="center">
            <Text variant="heading4">{l.receivedAmount ? formatBalance(l.receivedAmount, 'CFG', 2) : '-'}</Text>
            <Box
              as="a"
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Transaction on block explorer"
              ml={1}
            >
              <IconExternalLink size="iconSmall" color="textPrimary" />
            </Box>
          </Box>
        )
      },
      sortKey: 'receivedAmount',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Received at" />,
      cell: (l: Row) => <Text variant="heading4">{l.receivedAt ? formatDateAndTime(l.receivedAt) : '-'}</Text>,
      sortKey: 'receivedAt',
    },
  ]

  if (!merged.length) return null

  return (
    <Box>
      <Text variant="heading4" style={{ marginBottom: 16 }}>
        Migrations executed
      </Text>
      <DataTable data={data} columns={columns} />
    </Box>
  )
}
