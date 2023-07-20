import { useBalances } from '@centrifuge/centrifuge-react'
import { Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../../utils/useAddress'
import { RouterLinkButton } from '../RouterLinkButton'
import { Cubes } from './Cubes'

export function PortfolioCta() {
  const address = useAddress()
  const balances = useBalances(address)

  return (
    <Card p={3} pb={5} as="article" position="relative" overflow="hidden">
      {!address && <Cubes />}

      <Stack gap={2} alignItems="start">
        {address ? (
          <>
            <Text as="h2" variant="heading2">
              Your portfolio
            </Text>

            <Shelf as="dl" gap={6}>
              <Stack gap="4px">
                <Text as="dt" variant="body3">
                  Portfolio value
                </Text>
                <Text as="dd" variant="body2">
                  231,552 USD
                </Text>
              </Stack>

              <Stack gap="4px">
                <Text as="dt" variant="body3">
                  Accrued interest
                </Text>
                <Text as="dd" variant="body2">
                  231,552 USD
                </Text>
              </Stack>

              <Stack gap="4px">
                <Text as="dt" variant="body3">
                  CFG rewards
                </Text>
                <Text as="dd" variant="body2">
                  231,552 USD
                </Text>
              </Stack>
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
    </Card>
  )
}
