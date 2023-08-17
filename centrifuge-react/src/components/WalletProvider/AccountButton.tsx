import { ComputedMultisig } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import Identicon from '@polkadot/react-identicon'
import { WalletAccount } from '@subwallet/wallet-connect/types'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { useBalances } from '../../hooks/useBalances'
import { formatBalanceAbbreviated, truncateAddress } from '../../utils/formatting'
import { useCentrifugeUtils } from '../CentrifugeProvider'
import { Proxy } from './types'
import { useWallet } from './WalletProvider'

type AccountButtonProps = {
  address: string
  label: React.ReactNode
  proxyRights?: string
  icon: React.ReactNode
  selected?: boolean
  onClick: () => void
  multisig?: ComputedMultisig
}

const Root = styled(Shelf)<{ selected: boolean }>`
  cursor: pointer;
  border: none;
  appearance: none;
  outline: 0;
  text-align: left;

  &:hover {
    background-color: ${({ theme, selected }) =>
      selected ? theme.colors.borderSecondary : theme.colors.backgroundSecondary};
  }

  &:focus-visible {
    box-shadow: ${({ theme }) => `inset 0 0 0 1px ${theme.colors.accentPrimary}`};
  }
`

const IdenticonWrapper = styled.span`
  display: block;
  pointer-events: none;
`

export function AccountButton({
  address,
  label,
  proxyRights,
  icon,
  selected = false,
  onClick,
  multisig,
}: AccountButtonProps) {
  const { connectedType } = useWallet()
  const balances = useBalances(connectedType === 'substrate' ? address : undefined)
  const balance = balances
    ? formatBalanceAbbreviated(balances.native.balance, balances.native.currency.symbol)
    : undefined
  const utils = useCentrifugeUtils()

  return (
    <Root
      as="button"
      type="button"
      width="100%"
      p={1}
      alignItems="center"
      color="textPrimary"
      backgroundColor={selected ? 'backgroundSecondary' : 'transparent'}
      gap={1}
      onClick={onClick}
      selected={selected}
    >
      {icon}

      <Box as="span" flexGrow={2}>
        {label}
        {multisig && (
          <Text as="div" variant="label2" color="inherit">
            <Box
              as="span"
              display="inline-block"
              verticalAlign="middle"
              width="5px"
              height="5px"
              mr="3px"
              mt="-2px"
              borderRadius="50%"
              backgroundColor="accentPrimary"
              opacity={0.5}
            />
            Multisig: {truncateAddress(utils.formatAddress(multisig.address))}
          </Text>
        )}
        {proxyRights && (
          <Text as="div" variant="label2" color="inherit">
            <Box
              as="span"
              display="inline-block"
              verticalAlign="middle"
              width="5px"
              height="5px"
              mr="3px"
              mt="-2px"
              borderRadius="50%"
              backgroundColor="accentPrimary"
              opacity={0.5}
            />
            Proxied wallet: {proxyRights}
          </Text>
        )}
      </Box>

      {balance && (
        <Text as="span" variant="body2" fontWeight={400} textAlign="right">
          {balance}
        </Text>
      )}
    </Root>
  )
}

export function AccountIcon({ id }: { id: string }) {
  const { sizes } = useTheme()

  return (
    <IdenticonWrapper>
      <Identicon value={id} size={sizes.iconRegular as number} theme="polkadot" />
    </IdenticonWrapper>
  )
}

export function AccountName({ account, proxies }: { account: WalletAccount; proxies?: Proxy[] }) {
  const utils = useCentrifugeUtils()
  return (
    <Text as="span" variant="body2" fontWeight={300} style={{ display: 'block' }}>
      {account.name && (
        <>
          <Text as="span" fontWeight={500}>
            {account.name}
          </Text>{' '}
        </>
      )}
      {proxies?.map((p) => (
        <span key={p.delegator}>
          <Text as="span" color="textDisabled">
            |
          </Text>{' '}
          {truncateAddress(utils.formatAddress(p.delegator))}{' '}
        </span>
      ))}
    </Text>
  )
}
