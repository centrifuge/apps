import { Perquintill } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import { Decimal } from 'decimal.js-light'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { InvestButton, Token } from '../../pages/Pool/Overview'
import { daysBetween } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { usePool } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { CentrifugeTargetAPYs, DYF_POOL_ID, NS3_POOL_ID, centrifugeTargetAPYs } from '../PoolCard'
import { PoolMetaDataPartial } from '../PoolList'
import { Tooltips } from '../Tooltips'

type Row = {
  tokenName: string
  apy: Decimal
  tvl: Decimal
  tokenPrice: Decimal
  subordination: Decimal
  trancheId: string
  isTarget: boolean
}

export const TrancheTokenCards = ({
  trancheTokens,
  poolId,
  metadata,
}: {
  trancheTokens: Token[]
  poolId: string
  metadata: PoolMetaDataPartial
}) => {
  const pool = usePool(poolId)
  const theme = useTheme()
  const isTinlakePool = poolId.startsWith('0x')
  const daysSinceCreation = pool?.createdAt ? daysBetween(new Date(pool.createdAt), new Date()) : 0

  const getTrancheText = (trancheToken: Token) => {
    if (trancheToken.seniority === 0) return 'junior'
    if (trancheToken.seniority === 1) return 'senior'
    return 'mezzanine'
  }

  const columns = useMemo(() => {
    return [
      {
        header: 'Token',
        width: '40%',
        align: 'left',
        cell: (row: Row) => {
          return (
            <Text paddingY={2} fontWeight="400" variant="heading2">
              {row.tokenName}
            </Text>
          )
        },
      },
      {
        header: 'Yield since inception',
        align: 'left',
        cell: (row: Row) => {
          return (
            <Box>
              <Text style={{ marginRight: 4 }} fontWeight="600" variant="heading2">
                {row.apy}
              </Text>
              {row.isTarget && <Tooltips label="target" type="targetAPY" size="xs" />}
            </Box>
          )
        },
      },
      {
        header: `TVL (${pool?.currency.symbol})`,
        align: 'left',
        cell: (row: Row) => {
          return (
            <Text paddingY={2} fontWeight="400" variant="heading2">
              {formatBalance(row.tvl)}
            </Text>
          )
        },
      },
      {
        header: `Token price (${pool?.currency.symbol})`,
        align: 'left',
        cell: (row: Row) => {
          return (
            <Text paddingY={2} fontWeight="400" variant="heading2">
              {formatBalance(row.tokenPrice, undefined, 6)}
            </Text>
          )
        },
      },
      ...(pool.tranches.length > 1
        ? [
            {
              header: 'Subordination',
              align: 'left',
              cell: (row: Row) => {
                return (
                  <Text paddingY={2} fontWeight="400" variant="heading2">
                    {formatPercentage(row.subordination)}
                  </Text>
                )
              },
            },
          ]
        : []),
      {
        header: '',
        align: 'right',
        cell: (row: Row) => {
          return <InvestButton poolId={poolId} trancheId={row.trancheId} metadata={metadata} />
        },
      },
    ]
  }, [pool.tranches, metadata, poolId, pool?.currency.symbol])

  const dataTable = useMemo(() => {
    const getTarget = (tranche: Token) =>
      (isTinlakePool && tranche.seniority === 0) || poolId === DYF_POOL_ID || poolId === NS3_POOL_ID
    return trancheTokens.map((tranche) => {
      const calculateApy = (trancheToken: Token) => {
        if (isTinlakePool && getTrancheText(trancheToken) === 'senior') return formatPercentage(trancheToken.apy)
        if (isTinlakePool && trancheToken.seniority === 0) return '15%'
        if (poolId === DYF_POOL_ID) return centrifugeTargetAPYs[poolId as CentrifugeTargetAPYs][0]
        if (poolId === NS3_POOL_ID && trancheToken.seniority === 0)
          return centrifugeTargetAPYs[poolId as CentrifugeTargetAPYs][0]
        if (poolId === NS3_POOL_ID && trancheToken.seniority === 1)
          return centrifugeTargetAPYs[poolId as CentrifugeTargetAPYs][1]
        if (daysSinceCreation < 30) return 'N/A'
        return trancheToken.yieldSinceInception
          ? formatPercentage(new Perquintill(trancheToken.yieldSinceInception))
          : '-'
      }
      return {
        tokenName: tranche.name,
        apy: calculateApy(tranche),
        tvl: tranche.valueLocked,
        tokenPrice: tranche.tokenPrice,
        subordination: tranche.protection,
        trancheId: tranche.id,
        isTarget: getTarget(tranche),
      }
    })
  }, [trancheTokens, daysSinceCreation, isTinlakePool, poolId])

  return (
    <Shelf gap={3}>
      <Box
        marginY={2}
        backgroundColor="white"
        width="100%"
        overflow="auto"
        borderBottom={`1px solid ${theme.colors.borderPrimary}`}
      >
        <DataTable columns={columns} data={dataTable} hideBorder hideHeader />
      </Box>
    </Shelf>
  )
}
