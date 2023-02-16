import { Box, FabricTheme, Grid, Stack, Text, toPx } from '@centrifuge/fabric'
import centrifugeLogo from '@centrifuge/fabric/assets/logos/centrifuge.svg'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { Logo } from './SelectButton'
import type { State } from './types'
import { getWalletIcon } from './WalletDialog'
import { useWallet } from './WalletProvider'

type UserSelectionProps = {
  network: State['walletDialog']['network']
  wallet: State['walletDialog']['wallet']
}

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
  const { sizes } = useTheme()

  return (
    <Grid columns={3} equalColumns mx="auto" alignItems="end">
      <Column>
        <Title>Network</Title>
        <Selection>{network && <NetworkIcon network={network} />}</Selection>
      </Column>

      <Divider
        position="relative"
        width={21}
        height={`calc(${toPx(sizes.iconLarge)} * 0.5)`}
        mx="auto"
        borderStyle="dashed"
        borderWidth={0}
        borderColor="textPrimary"
        borderTopWidth={1}
      />

      <Column>
        <Title>Wallet</Title>
        <Selection>{wallet && <Logo src={getWalletIcon(wallet)} />}</Selection>
      </Column>
    </Grid>
  )
}

export type NetworkIconProps = {
  network: UserSelectionProps['network']
  size?: FabricTheme['sizes']['iconSmall' | 'iconMedium' | 'iconRegular' | 'iconLarge']
}

export function NetworkIcon({ network, size = 'iconRegular' }: NetworkIconProps) {
  const { evm } = useWallet()
  const src = !network ? '' : network === 'centrifuge' ? centrifugeLogo : evm.chains[network]?.logo?.src

  return <Logo src={src} size={size} />
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
  const { sizes } = useTheme()

  return (
    <Box
      width={sizes.iconLarge}
      height={sizes.iconLarge}
      p={`calc((${toPx(sizes.iconLarge)} - ${toPx(sizes.iconRegular)}) * .5 )`}
      borderStyle="dashed"
      borderWidth={children ? 0 : 1}
      borderColor="textDisabled"
      borderRadius="50%"
      backgroundColor="backgroundInput"
    >
      {children}
    </Box>
  )
}
