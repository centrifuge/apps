import { useBalances, useCentrifugeConsts, useWallet } from '@centrifuge/centrifuge-react'
import { Box, Button, Stack, Text } from '@centrifuge/fabric'
import { useTheme } from 'styled-components'
import { config } from '../../config'
import { Dec } from '../../utils/Decimal'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { useListedPools } from '../../utils/useListedPools'
import { useComputeLiquidityRewards } from '../LiquidityRewards/hooks'
import { Cubes } from './Cubes'

export function PortfolioCta() {
  const { showNetworks } = useWallet()
  const { colors } = useTheme()
  const address = useAddress()
  const balances = useBalances(address)
  const consts = useCentrifugeConsts()
  const [, listedTokens] = useListedPools()
  const isMedium = useIsAboveBreakpoint('M')

  const stakes = balances?.tranches.map(({ poolId, trancheId }) => ({ poolId, trancheId })) ?? []
  const rewards = useComputeLiquidityRewards(address, stakes)

  const currencies = balances?.currencies.map(({ balance }) => balance.toDecimal()) ?? []
  const tranches =
    balances?.tranches.map(({ balance, trancheId }) => {
      const token = listedTokens.find(({ id }) => id === trancheId)
      return balance.toDecimal().mul(token?.tokenPrice?.toDecimal() ?? Dec(0))
    }) ?? []
  const investedValue = [...currencies, ...tranches].reduce((a, b) => a.add(b), Dec(0))

  const terms = [
    {
      title: 'Portfolio value',
      value: investedValue.gte(1000)
        ? formatBalanceAbbreviated(investedValue, config.baseCurrency)
        : formatBalance(investedValue, config.baseCurrency),
    },
    {
      title: 'CFG rewards',
      value: formatBalance(rewards, consts.chainSymbol, 2),
    },
  ]

  if (address || !isMedium) return null

  return (
    <Box
      as="article"
      position="relative"
      p={3}
      pb={5}
      overflow="hidden"
      borderRadius="card"
      borderStyle="solid"
      borderWidth={1}
      borderColor={'borderPrimary'}
      style={{
        boxShadow: `0px 3px 2px -2px ${colors.borderPrimary}`,
      }}
    >
      {!address && <Cubes />}

      <Stack gap={2} alignItems="start">
        <>
          <Text as="h2" variant="body1" style={{ maxWidth: '35ch' }}>
            Pools on Centrifuge let investors earn yield from real-world assets.
          </Text>
          <Button onClick={() => showNetworks()}>Get started</Button>
        </>
      </Stack>
    </Box>
  )
}
