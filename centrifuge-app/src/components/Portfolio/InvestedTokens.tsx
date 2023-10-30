import { Token, TokenBalance } from '@centrifuge/centrifuge-js'
import { formatBalance, useAddress, useBalances, useCentrifuge } from '@centrifuge/centrifuge-react'
import {
  AnchorButton,
  Box,
  Button,
  Grid,
  IconExternalLink,
  IconMinus,
  IconPlus,
  Shelf,
  Stack,
  Text,
  Thumbnail,
} from '@centrifuge/fabric'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { usePool, usePoolMetadata, usePools } from '../../utils/usePools'
import { Column, DataTable, SortableTableHeader } from '../DataTable'
import { Eththumbnail } from '../EthThumbnail'

type Row = {
  currency: Token['currency']
  poolId: string
  trancheId: string
  marketValue: TokenBalance
  position: TokenBalance
  tokenPrice: TokenBalance
  canInvestRedeem: boolean
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Token',
    cell: (token: Row) => {
      return <TokenWithIcon {...token} />
    },
    width: '2fr',
  },
  {
    header: 'Token price',
    cell: ({ tokenPrice }: Row) => {
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalance(tokenPrice.toDecimal() || 1, 'USDT', 4)}
        </Text>
      )
    },
  },
  {
    header: <SortableTableHeader label="Position" />,
    cell: ({ currency, position }: Row) => {
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalance(position, currency.symbol)}
        </Text>
      )
    },
    sortKey: 'position',
  },
  {
    header: <SortableTableHeader label="Market value" />,
    cell: ({ marketValue }: Row) => {
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalance(marketValue, 'USDT', 4)}
        </Text>
      )
    },
    sortKey: 'marketValue',
  },
  {
    align: 'left',
    header: '', // invest redeem buttons
    cell: ({ canInvestRedeem, poolId }: Row) => {
      const isTinlakePool = poolId.startsWith('0x')
      return (
        canInvestRedeem && (
          <Shelf gap={1} justifySelf="end">
            {isTinlakePool ? (
              <AnchorButton
                variant="tertiary"
                small
                icon={IconExternalLink}
                href="https://legacy.tinlake.centrifuge.io/portfolio"
                target="_blank"
              >
                View on Tinlake
              </AnchorButton>
            ) : (
              <>
                <Button small variant="tertiary" icon={IconMinus}>
                  Redeem
                </Button>
                <Button small variant="tertiary" icon={IconPlus}>
                  Invest
                </Button>
              </>
            )}
          </Shelf>
        )
      )
    },
  },
]

// TODO: change canInvestRedeem to default to true once the drawer is implemented
export const InvestedTokens = ({ canInvestRedeem = false }) => {
  const address = useAddress()
  const centBalances = useBalances(address)
  const { data: tinlakeBalances } = useTinlakeBalances()
  const pools = usePools()

  const balances = useMemo(() => {
    return [
      ...(centBalances?.tranches || []),
      ...(tinlakeBalances?.tranches.filter((tranche) => !tranche.balance.isZero) || []),
    ]
  }, [centBalances, tinlakeBalances])

  const tableData = balances.map((balance) => {
    const pool = pools?.find((pool) => pool.id === balance.poolId)
    const tranche = pool?.tranches.find((tranche) => tranche.id === balance.trancheId)
    return {
      currency: balance.currency,
      poolId: balance.poolId,
      trancheId: balance.trancheId,
      position: balance.balance,
      tokenPrice: tranche?.tokenPrice || Dec(1),
      marketValue: tranche?.tokenPrice ? balance.balance.toDecimal().mul(tranche?.tokenPrice.toDecimal()) : Dec(0),
      canInvestRedeem,
    }
  })

  return tableData.length ? (
    <Stack as="article" gap={2}>
      <Text as="h2" variant="heading2">
        Portfolio
      </Text>
      <DataTable columns={columns} data={tableData} />
    </Stack>
  ) : null
}

const TokenWithIcon = ({ poolId, currency }: Row) => {
  const pool = usePool(poolId, false)
  const { data: metadata } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  const { sizes } = useTheme()
  const icon = metadata?.pool?.icon?.uri ? cent.metadata.parseMetadataUrl(metadata.pool.icon.uri) : null
  return (
    <Grid as="header" gridTemplateColumns={`${sizes.iconMedium}px 1fr`} alignItems="center" gap={2}>
      <Eththumbnail show={!!poolId.startsWith('0x')}>
        {icon ? (
          <Box as="img" src={icon} alt="" height="iconMedium" width="iconMedium" />
        ) : (
          <Thumbnail type="pool" label="LP" size="small" />
        )}
      </Eththumbnail>

      <Text textOverflow="ellipsis" variant="body3">
        {currency.name}
      </Text>
    </Grid>
  )
}
