import { Token, TokenBalance } from '@centrifuge/centrifuge-js'
import { formatBalance, useBalances, useCentrifuge } from '@centrifuge/centrifuge-react'
import {
  AnchorButton,
  Box,
  Button,
  Drawer,
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
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom'
import { useTheme } from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { formatBalanceAbbreviated } from '../../utils/formatting'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { useCFGTokenPrice } from '../../utils/useCFGTokenPrice'
import { usePool, usePoolMetadata, usePools } from '../../utils/usePools'
import { Column, DataTable, SortableTableHeader } from '../DataTable'
import { Eththumbnail } from '../EthThumbnail'
import { CFGTransfer } from './CFGTransfer'

type Row = {
  currency: Token['currency']
  poolId: string
  trancheId: string
  marketValue: TokenBalance
  position: TokenBalance
  tokenPrice: TokenBalance
  canInvestRedeem: boolean
  address: string
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Token',
    cell: (token: Row) => {
      return <TokenWithIcon {...token} />
    },
  },
  {
    header: 'Token price',
    cell: ({ tokenPrice }: Row) => {
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalance(tokenPrice || 1, 'USDT', 4)}
        </Text>
      )
    },
    align: 'left',
  },
  {
    header: <SortableTableHeader label="Position" />,
    cell: ({ currency, position }: Row) => {
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalanceAbbreviated(position, currency.symbol, 2)}
        </Text>
      )
    },
    sortKey: 'position',
    align: 'left',
  },
  {
    header: <SortableTableHeader label="Market value" />,
    cell: ({ marketValue }: Row) => {
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalanceAbbreviated(marketValue, 'USDT', 2)}
        </Text>
      )
    },
    sortKey: 'marketValue',
    align: 'left',
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
export function Holdings({ canInvestRedeem = false, address }: { canInvestRedeem?: boolean; address: string }) {
  const centBalances = useBalances(address)
  const { data: tinlakeBalances } = useTinlakeBalances()
  const pools = usePools()
  const { search, pathname } = useLocation()
  const route = useRouteMatch(['/portfolio', '/prime'])
  const basePath = route?.path || ''
  const history = useHistory()
  const params = new URLSearchParams(search)
  const openDrawer = params.get('transfer') === 'cfg'

  const CFGPrice = useCFGTokenPrice()

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
      tokenPrice: tranche?.tokenPrice?.toDecimal() || Dec(1),
      marketValue: tranche?.tokenPrice ? balance.balance.toDecimal().mul(tranche?.tokenPrice.toDecimal()) : Dec(0),
      canInvestRedeem,
    }
  })

  centBalances &&
    tableData.push({
      currency: {
        ...centBalances?.native.currency,
        name: 'Centrifuge',
        key: 'centrifuge',
        isPoolCurrency: false,
        isPermissioned: false,
      },
      poolId: '',
      trancheId: '',
      position: centBalances?.native.balance,
      tokenPrice: CFGPrice ? Dec(CFGPrice) : Dec(0),
      marketValue: CFGPrice ? centBalances?.native.balance.toDecimal().mul(CFGPrice) : Dec(0),
      canInvestRedeem: false,
    })

  return tableData.length ? (
    <Stack as="article" gap={2}>
      <Drawer isOpen={openDrawer} onClose={() => history.replace(basePath)}>
        <CFGTransfer address={address} />
      </Drawer>
      <Text as="h2" variant="heading2">
        Holdings
      </Text>
      <DataTable
        columns={columns}
        data={tableData}
        onRowClicked={(row) =>
          basePath === '/portfolio' && row.currency.symbol === centBalances?.native.currency.symbol
            ? `portfolio?transfer=cfg`
            : pathname
        }
      />
    </Stack>
  ) : null
}

const TokenWithIcon = ({ poolId, currency }: Row) => {
  const pool = usePool(poolId, false)
  const { data: metadata } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  const { sizes } = useTheme()
  const icon = metadata?.pool?.icon?.uri
    ? cent.metadata.parseMetadataUrl(metadata.pool.icon.uri)
    : !poolId
    ? cent.metadata.parseMetadataUrl('ipfs://Qmbo43MdtokiRQ5fTLT8FoYZo6kJrW56vUqXjqYQY6Fg9f')
    : null
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
