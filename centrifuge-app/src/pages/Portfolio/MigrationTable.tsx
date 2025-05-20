import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Text } from '@centrifuge/fabric'
import { formatDateAndTime } from '../../../src/utils/date'
import { formatBalance } from '../../../src/utils/formatting'
import { useMigrationPairs } from '../../../src/utils/usePools'
import { truncate } from '../../../src/utils/web3'
import { DataTable, SortableTableHeader } from '../../components/DataTable'
import { isEvmAddress } from '../../utils/address'

type Migration = {
  sentAmount?: CurrencyBalance
  sentAt?: string
  toAccount: string
  migrationPairId: string
  txHash: string
  receivedAmount?: CurrencyBalance
  receivedAt?: string
}

type Row = {
  migrationPairId: string
  receivedAmount: CurrencyBalance
  receivedAt: string
  sentAmount: CurrencyBalance
  sentAt: string
  toAccount: string
  txHash: string
}

function mergeMigrations(sentMigrations: Migration[], receivedMigrations: Migration[]): Row[] {
  const map = new Map<string, Partial<Row>>()

  sentMigrations.forEach((sent) => {
    const id = sent.migrationPairId
    map.set(id, {
      migrationPairId: id,
      sentAmount: sent.sentAmount,
      sentAt: sent.sentAt,
      toAccount: sent.toAccount,
      txHash: sent.txHash,
    })
  })

  receivedMigrations.forEach((rcv) => {
    const id = rcv.migrationPairId
    const row = map.get(id) ?? { migrationPairId: id }
    Object.assign(row, {
      receivedAmount: rcv.receivedAmount,
      receivedAt: rcv.receivedAt,
    })
    map.set(id, row)
  })

  return Array.from(map.values()) as Row[]
}

export const MigrationTable = ({ address }: { address: string }) => {
  const utils = useCentrifugeUtils()
  const migrationPairs = useMigrationPairs(address)
  const { sentMigrations, receivedMigrations } = migrationPairs ?? { sentMigrations: [], receivedMigrations: [] }
  const merged = mergeMigrations(sentMigrations, receivedMigrations)

  const data = merged.map((m) => ({
    migrationPairId: m.migrationPairId,
    sentAmount: m.sentAmount,
    sentAt: m.sentAt,
    receivedAmount: m.receivedAmount,
    receivedAt: m.receivedAt,
    txHash: m.txHash,
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
      cell: (l: Row) => <Text variant="heading4">{l.toAccount}</Text>,
      sortKey: 'toAccount',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Sent amount" />,
      cell: (l: Row) => <Text variant="heading4">{l.sentAmount ? formatBalance(l.sentAmount, 'CFG', 2) : '-'}</Text>,
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
        if (!l.receivedAmount) return <Text variant="heading4">-</Text>
        return <Text variant="heading4">{l.receivedAmount ? formatBalance(l.receivedAmount, 'CFG', 2) : '-'}</Text>
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
