import { useBalances } from '@centrifuge/centrifuge-react'
import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { formatBalanceAbbreviated } from '../../utils/formatting'
import { usePoolMetadataMulti, usePools } from '../../utils/usePools'
import { LabelValueStack } from '../LabelValueStack'
import { AssetClassChart } from './AssetClassChart'

const assetClassLabels = {
  privateCredit: 'Private Credit',
  publicCredit: 'Public Credit',
}
type AssetClass = 'publicCredit' | 'privateCredit'

export function AssetAllocation({ address }: { address: string }) {
  const balances = useBalances(address)
  const pools = usePools()
  const theme = useTheme()
  const poolIds = new Set(balances?.tranches.map((t) => t.poolId))
  const filteredPools = pools?.filter((p) => poolIds.has(p.id)) ?? []
  const metas = usePoolMetadataMulti(filteredPools)
  const assetClasses = [...new Set(metas.map((m) => m.data?.pool?.asset?.class as string).filter(Boolean))]
  const valueByClass: Record<string, Decimal> = Object.fromEntries(assetClasses.map((item) => [item, Dec(0)]))
  balances?.tranches.forEach((balance) => {
    const poolIndex = filteredPools.findIndex((p) => p.id === balance.poolId)
    const price =
      filteredPools[poolIndex]?.tranches.find((t) => t.id === balance.trancheId)?.tokenPrice?.toDecimal() ?? Dec(0)
    const asset = metas[poolIndex].data?.pool?.asset?.class
    valueByClass[asset!] = valueByClass[asset!]?.add(balance.balance.toDecimal().mul(price))
  })

  const shades = [600, 800, 200, 400]
  const tableDataWithColor = assetClasses.map((item, index) => {
    const nextShade = shades[index % shades.length]
    return {
      name: assetClassLabels[item as AssetClass] ?? item,
      share: valueByClass[item].toNumber(),
      color: theme.colors.accentScale[nextShade],
      labelColor: nextShade >= 500 ? 'white' : 'black',
    }
  })

  const sharesForPie = tableDataWithColor.map(({ name, color, labelColor, share }) => {
    return { value: Number(share), name: name, color, labelColor }
  })

  return !!balances?.tranches && !!balances?.tranches.length ? (
    <Stack gap={2}>
      <Text as="h2" variant="heading2">
        Allocation
      </Text>
      <Shelf gap={8}>
        <AssetClassChart data={sharesForPie} />
        <Shelf as="ul" alignSelf="stretch" alignItems="stretch" flex={1} gap={6}>
          {tableDataWithColor.map((cell, i) => (
            <>
              {i > 0 && <Box width="1px" backgroundColor="borderSecondary" />}
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
                    <Text variant="heading2">{formatBalanceAbbreviated(cell.share, 'USD')}</Text>
                  </Box>
                }
                key={i}
              />
            </>
          ))}
        </Shelf>
      </Shelf>
    </Stack>
  ) : null
}
