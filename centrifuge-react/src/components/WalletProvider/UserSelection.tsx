import { Box, Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import type { State } from './types'

type UserSelectionProps = {
  network: State['walletDialog']['network']
  wallet: State['walletDialog']['wallet']
}

const iconSize = 42

const Divider = styled(Box)`
  &::after {
    content: '';
    position: absolute;
    top: -0.5px;
    right: -1px;
    width: 8px;
    height: 8px;
    border: ${({ theme }) => `1px solid ${theme.colors.textPrimary}`};
    border-bottom-width: 0;
    border-left-width: 0;
    transform-origin: top right;
    transform: rotate(45deg);
  }
`

export function UserSelection({ network, wallet }: UserSelectionProps) {
  console.log('network', network)
  console.log('network', wallet)

  return (
    <Grid columns={3} equalColumns mx="auto" alignItems="end">
      <Column>
        <Title>Network</Title>
        <Selection></Selection>
      </Column>

      <Divider
        position="relative"
        width={21}
        height={iconSize * 0.5}
        mx="auto"
        borderStyle="dashed"
        borderWidth={0}
        borderColor="textPrimary"
        borderTopWidth={1}
      />

      <Column>
        <Title>Wallet</Title>
        <Selection></Selection>
      </Column>
    </Grid>
  )
}

function Column({ children }: { children?: React.ReactNode }) {
  return (
    <Stack alignItems="center" gap="5px">
      {children}
    </Stack>
  )
}

function Title({ children }: { children?: React.ReactNode }) {
  return (
    <Text as="small" variant="interactive2">
      {children}
    </Text>
  )
}

function Selection({ children }: { children?: React.ReactNode }) {
  return (
    <Box
      width={iconSize}
      height={iconSize}
      borderStyle="dashed"
      borderWidth={1}
      borderColor="textDisabled"
      borderRadius="50%"
    >
      {children}
    </Box>
  )
}
