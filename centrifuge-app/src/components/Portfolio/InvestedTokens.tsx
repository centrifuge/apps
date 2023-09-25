import { useBalances } from '@centrifuge/centrifuge-react'
import { Box, Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../../utils/useAddress'
import { TokenCard, TOKEN_CARD_COLUMNS, TOKEN_CARD_GAP } from '../TokenCard'

export function InvestedTokens() {
  const address = useAddress()
  const balances = useBalances(address)

  return !!balances?.tranches && !!balances?.tranches.length ? (
    <>
      <Box as="article">
        <Text as="h2" variant="heading2">
          Portfolio Composition
        </Text>
      </Box>
      <Stack gap={1}>
        <Grid gridTemplateColumns={TOKEN_CARD_COLUMNS} gap={TOKEN_CARD_GAP} px={2}>
          <Text as="span" variant="body3">
            Token
          </Text>
          <Text as="button" variant="body3">
            Position
          </Text>
          <Text as="span" variant="body3">
            Token price
          </Text>
          <Text as="button" variant="body3">
            Market value
          </Text>
        </Grid>

        <Stack as="ul" role="list" gap={1}>
          {balances.tranches.map((tranche, index) => (
            <Box key={`${tranche.trancheId}${index}`} as="li">
              <TokenCard {...tranche} />
            </Box>
          ))}
        </Stack>
      </Stack>
    </>
  ) : null
}
