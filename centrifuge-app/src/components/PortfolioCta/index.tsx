import { useBalances } from '@centrifuge/centrifuge-react'
import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { useAddress } from '../../utils/useAddress'
import { RouterLinkButton } from '../RouterLinkButton'
import { Cubes } from './Cubes'

export function PortfolioCta() {
  const { colors } = useTheme()
  const address = useAddress()
  const balances = useBalances(address)
  console.log('balances', balances)

  const terms = [
    {
      title: 'Portfolio value',
      value: '231,552 USD',
    },
    {
      title: 'Accrued interest',
      value: '231,552 USD',
    },
    {
      title: 'CFG rewards',
      value: '231,552 USD',
    },
  ]

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
      borderColor="borderSecondary"
      style={{
        boxShadow: `0px 3px 2px -2px ${colors.borderPrimary}`,
      }}
    >
      {!address && <Cubes />}

      <Stack gap={2} alignItems="start">
        {address ? (
          <>
            <Text as="h2" variant="heading2">
              Your portfolio
            </Text>

            <Shelf as="dl" gap={6} flexWrap="wrap" rowGap={2}>
              {terms.map(({ title, value }, index) => (
                <Stack key={`${title}${index}`} gap="4px">
                  <Text as="dt" variant="body3" whiteSpace="nowrap">
                    {title}
                  </Text>
                  <Text as="dd" variant="body2" whiteSpace="nowrap">
                    {value}
                  </Text>
                </Stack>
              ))}
            </Shelf>
          </>
        ) : (
          <>
            <Text as="h2" variant="body1" style={{ maxWidth: '35ch' }}>
              Pools on Centrifuge let investors earn yield from real-world assets.
            </Text>
            <RouterLinkButton to="/onboarding">Get started</RouterLinkButton>
          </>
        )}
      </Stack>
    </Box>
  )
}
