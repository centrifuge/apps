import { formatCurrencyAmount, formatPercentage } from '@centrifuge/centrifuge-js'
import { IconArrowDown, IconChevronRight, Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import { BN } from '@polkadot/util'
import * as React from 'react'
import { useHistory } from 'react-router'
import styled from 'styled-components'
import { usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, OrderBy } from './DataTable'

export type Token = {
  poolMetadata: string
  yield: string
  protection: string
  valueLocked: string
  currency: string
  name: string
  index: number
  poolId: string
}

type Props = {
  tokens: Token[]
}

type RowProps = {
  token: Token
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Token',
    cell: (token: Token) => <TokenName token={token} />,
    flex: '9',
  },
  {
    align: 'left',
    header: 'Asset class',
    cell: (token: Token) => <AssetClass token={token} />,
    flex: '4',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Yield" orderBy={orderBy} />,
    cell: (token: Token) => <Yield token={token} />,
    flex: '4',
    sortKey: 'yield',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Protection" orderBy={orderBy} />,
    cell: (token: Token) => <Protection token={token} />,
    flex: '4',
    sortKey: 'protection',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Value locked" orderBy={orderBy} />,
    cell: (token: Token) => <ValueLocked token={token} />,
    flex: '4',
    sortKey: 'valueLocked',
  },
  {
    header: '',
    cell: () => <IconChevronRight size={24} color="textPrimary" />,
    flex: '0 1 52px',
  },
]

export const TokenList: React.FC<Props> = ({ tokens }) => {
  const history = useHistory()

  return (
    <DataTable
      data={tokens}
      columns={columns}
      defaultSortKey="valueLocked"
      rounded={false}
      onRowClicked={(token: Token) => {
        history.push(`/tokens/${token.poolId}/${token.index}`)
      }}
    />
  )
}

const TokenName: React.VFC<RowProps> = ({ token }) => {
  const { data: metadata } = usePoolMetadata({ metadata: token.poolMetadata })
  const symbol = metadata?.tranches?.find((_, index) => index === token.index)?.symbol
  return (
    <Shelf gap="2">
      <Thumbnail label={symbol || ''} size="small" />
      <Text variant="body2" color="textPrimary" fontWeight={600}>
        {metadata?.pool?.name} {token?.name}
      </Text>
    </Shelf>
  )
}

const AssetClass: React.VFC<RowProps> = ({ token }) => {
  const { data: metadata } = usePoolMetadata({ metadata: token.poolMetadata })
  return <Text variant="body2">{metadata?.pool?.asset.class}</Text>
}

const Yield: React.VFC<RowProps> = ({ token }) => {
  const apr = parseInt(token.yield, 10)
  return <Text variant="body2">{apr > 0 ? `Target: ${apr.toPrecision(3)}%` : ''}</Text>
}

const Protection: React.VFC<RowProps> = ({ token }) => {
  return (
    <Text variant="body2">
      {parseInt(token.protection, 10) > 0 && formatPercentage(token.protection, new BN(10).pow(new BN(18)).toString())}
    </Text>
  )
}

const ValueLocked: React.VFC<RowProps> = ({ token }) => {
  return <Text variant="body2">{formatCurrencyAmount(token?.valueLocked, token.currency)}</Text>
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
