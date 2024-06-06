import { Box, Shelf, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'
import { useTheme } from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { formatBalanceAbbreviated } from '../../utils/formatting'
import { useListedPools } from '../../utils/useListedPools'
import { usePoolMetadataMulti } from '../../utils/usePools'
import { LabelValueStack } from '../LabelValueStack'
import { AssetClassChart } from './AssetClassChart'
import { useHoldings } from './Holdings'

export function AssetAllocation({ address, chainId }: { address?: string; chainId?: number }) {
  const holdings = useHoldings(address, chainId)
  const [pools] = useListedPools()
  const theme = useTheme()
  const poolIds = new Set(holdings.map((h) => h.poolId).filter((i) => !!i))
  const filteredPools = pools?.filter((p) => poolIds.has(p.id)) ?? []
  const metas = usePoolMetadataMulti(filteredPools)

  const assetClasses = [
    ...new Set(metas.map((m) => capitalize(startCase(m.data?.pool?.asset?.class)) as string).filter(Boolean)),
  ]
  const valueByClass: Record<string, Decimal> = Object.fromEntries(assetClasses.map((item) => [item, Dec(0)]))
  let total = Dec(0)
  holdings.forEach((holding) => {
    const poolIndex = filteredPools.findIndex((p) => p.id === holding.poolId)
    const asset = capitalize(startCase(metas[poolIndex]?.data?.pool?.asset?.class))
    const value = holding.marketValue
    total = total.add(value)
    valueByClass[asset!] = valueByClass[asset!]?.add(value)
  })

  const shades = [700, 500]
  const shares = assetClasses
    .map((item, index) => {
      const nextShade = shades[index % shades.length]
      return {
        name: item,
        value: valueByClass[item].toNumber(),
        color: theme.colors.accentScale[nextShade],
        labelColor: nextShade >= 500 ? 'white' : 'black',
      }
    })
    .sort((a, b) => (b.value > a.value ? 1 : a === b ? 0 : -1))

  return address && !!holdings.length ? (
    <Shelf gap={8}>
      <AssetClassChart data={shares} currency="USD" total={total.toNumber()} />
      <Shelf as="ul" alignSelf="stretch" alignItems="stretch" flex={1} gap={6}>
        {shares.map((cell, i) => (
          <Box key={`asset-allocation-${cell.name}-${i}`}>
            {i > 0 && <Box width="1px" backgroundColor="borderPrimary" />}
            <LabelValueStack
              label={
                <Box position="relative" ml={22}>
                  {cell.name}
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: cell.color,
                      position: 'absolute',
                      top: '50%',
                      right: 'calc(100% + 10px)',
                      transform: 'translateY(-50%)',
                    }}
                  />
                </Box>
              }
              value={
                <Box ml={22}>
                  <Text variant="heading2">{formatBalanceAbbreviated(cell.value, 'USD')}</Text>
                </Box>
              }
              key={i}
            />
          </Box>
        ))}
      </Shelf>
    </Shelf>
  ) : (
    <Shelf borderRadius="4px" backgroundColor="backgroundSecondary" justifyContent="center" p="10px">
      <Text color="textSecondary" variant="body2">
        No allocation displayed yet
      </Text>
    </Shelf>
  )
}
