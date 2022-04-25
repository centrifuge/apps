import { formatPercentage } from '@centrifuge/centrifuge-js'
import { IconArrowDown, IconChevronRight, Shelf, Text } from '@centrifuge/fabric'
import { BN } from '@polkadot/util'
import * as React from 'react'
import { useHistory } from 'react-router'
import styled from 'styled-components'
import { Column, DataTable, OrderBy } from './DataTable'

export type TokenByPool = {
  apy?: string
  protection: string
  name: string
  symbol: string
  poolName?: string
  index: number
  poolId: string
}

type Props = {
  tokens: TokenByPool[]
}

type RowProps = {
  token: TokenByPool
}

const columns: Column[] = [
  {
    align: 'left',
    header: (orderBy: OrderBy) => <SortableHeader label="Seniority" orderBy={orderBy} />,
    cell: (token: TokenByPool) => <Text variant="body2"> {token.index + 1}</Text>,
    flex: '2',
    sortKey: 'index',
  },
  {
    align: 'left',
    header: 'Name',
    cell: (token: TokenByPool) => <TokenName token={token} />,
    flex: '3',
  },
  {
    header: 'Symbol',
    cell: (token: TokenByPool) => <Text variant="body2">{token?.symbol}</Text>,
    flex: '2',
    align: 'left',
    sortKey: 'symbol',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Minimum Protection" orderBy={orderBy} />,
    cell: (token: TokenByPool) => <Protection token={token} />,
    flex: '2',
    sortKey: 'protection',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="APY" orderBy={orderBy} />,
    cell: (token: TokenByPool) => <APY token={token} />,
    flex: '2',
    sortKey: 'apy',
  },
  {
    header: '',
    cell: () => <IconChevronRight size={24} color="textPrimary" />,
    flex: '0 1 52px',
  },
]

export const TokenListByPool: React.FC<Props> = ({ tokens }) => {
  const history = useHistory()

  return (
    <DataTable
      data={tokens}
      columns={columns}
      defaultSortKey="valueLocked"
      onRowClicked={(token: TokenByPool) => {
        history.push(`/tokens/${token.poolId}/${token.index}`)
      }}
    />
  )
}

const TokenName: React.VFC<RowProps> = ({ token }) => {
  return (
    <Text variant="body2" color="textPrimary" fontWeight={600}>
      {token?.poolName} {token?.name}
    </Text>
  )
}

const APY: React.VFC<RowProps> = ({ token }) => {
  const apr = parseInt(token?.apy || '0', 10)
  return <Text variant="body2">{apr > 0 ? `${apr.toPrecision(3)}%` : ''}</Text>
}

const Protection: React.VFC<RowProps> = ({ token }) => {
  return <Text variant="body2">{formatPercentage(token.protection, new BN(10).pow(new BN(18)).toString())}</Text>
}

const SortableHeader: React.VFC<{ label: string; orderBy?: OrderBy }> = ({ label, orderBy }) => {
  return (
    <StyledHeader>
      {label}
      <IconArrowDown
        color={orderBy ? 'currentColor' : 'transparent'}
        size={16}
        style={{ transform: orderBy === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }}
      />
    </StyledHeader>
  )
}

const StyledHeader = styled(Shelf)`
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover,
  &:hover > svg {
    color: ${({ theme }) => theme.colors.textInteractiveHover};
  }
`
