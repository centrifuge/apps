import {
  AnchorButton,
  Box,
  Button,
  Dialog,
  Grid,
  IconAlertCircle,
  IconCheck,
  IconDownload,
  Menu,
  MenuItem,
  MenuItemGroup,
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
import Identicon from '@polkadot/react-identicon'
import { Wallet } from '@subwallet/wallet-connect/types'
import { MetaMask } from '@web3-react/metamask'
import * as React from 'react'
import styled from 'styled-components'
import { truncateAddress } from '../../utils/formatting'
import { EvmChains } from './evm/chains'
import { EvmConnectorMeta } from './evm/connectors'
import { isMetaMaskWallet } from './evm/utils'
import { useWallet, wallets } from './WalletProvider'

type Props = {
  evmChains: EvmChains
}

export function WalletDialog({ evmChains }: Props) {
  const ctx = useWallet()
  const {
    connectedType,
    pendingConnect: { isConnecting, wallet: pendingWallet, isError: isConnectError },
    walletDialog: { view, network: selectedNetwork, wallet: selectedWallet },
    dispatch,
    showWallets,
    connect: doConnect,
    evm,
  } = ctx

  const shownWallets = (
    selectedNetwork === 'centrifuge' ? [...wallets] : !!selectedNetwork ? [...evm.connectors] : []
  ).sort((wallet) => (wallet.installed ? -1 : 1))

  function isEnabled(wallet: Wallet | EvmConnectorMeta) {
    return selectedNetwork && (selectedNetwork === 'centrifuge') !== 'connector' in wallet
  }

  function close() {
    dispatch({ type: 'closeWalletDialog' })
  }

  async function connect(wallet: Wallet | EvmConnectorMeta) {
    try {
      const accounts = await doConnect(wallet, typeof selectedNetwork === 'number' ? selectedNetwork : undefined)
      if (accounts?.length && 'extensionName' in wallet) {
        // Showing the account picker even when there's only one account, as the user might have proxies
        dispatch({ type: 'showWalletDialogAccounts' })
      } else {
        close()
      }
    } catch {}
  }

  return (
    <Dialog title="Select a wallet" isOpen={!!view} onClose={close}>
      <Stack gap={4}>
        <Grid columns={2} equalColumns>
          <Text>network: {selectedNetwork}</Text>
          <Text>wallet: {selectedWallet?.title}</Text>
        </Grid>
        {view === 'wallets' ? (
          <>
            <Stack gap={2}>
              <Text variant="heading6">Network</Text>
              <Grid minColumnWidth={120}>
                <Button
                  onClick={() => showWallets('centrifuge')}
                  active={selectedNetwork === 'centrifuge'}
                  variant="tertiary"
                  small
                >
                  Centrifuge
                </Button>
                {Object.entries(evmChains).map(([chainId, chain]) => (
                  <Button
                    // icon={<Box as="img" src={chain.logo?.src ?? ''} alt="" width="iconMedium" />}
                    onClick={() => showWallets(Number(chainId))}
                    active={selectedNetwork === Number(chainId)}
                    variant="tertiary"
                    small
                  >
                    {chain.name}
                  </Button>
                ))}
              </Grid>
            </Stack>
            <Stack gap={2}>
              <Text variant="heading6">Wallet</Text>
              <Grid minColumnWidth={120} gap={2}>
                {shownWallets.map((wallet) =>
                  wallet.installed ? (
                    <Button
                      key={wallet.title}
                      icon={<Box as="img" src={getWalletIcon(wallet)} alt="" width="iconMedium" />}
                      iconRight={
                        selectedWallet && isConnectError && selectedWallet === wallet ? IconAlertCircle : undefined
                      }
                      onClick={() => {
                        showWallets(selectedNetwork, wallet)
                        connect(wallet)
                      }}
                      disabled={!isEnabled(wallet)}
                      loading={isConnecting && wallet === pendingWallet}
                      active={ctx[connectedType!]?.selectedWallet === wallet}
                      variant="tertiary"
                      small
                    >
                      {getWalletLabel(wallet)}
                    </Button>
                  ) : (
                    <AnchorButton
                      href={wallet.installUrl}
                      target="_blank"
                      key={wallet.title}
                      icon={<Box as="img" src={getWalletIcon(wallet)} alt="" width="iconMedium" />}
                      iconRight={IconDownload}
                      disabled={!isEnabled(wallet)}
                      variant="tertiary"
                      small
                    >
                      {getWalletLabel(wallet)}
                    </AnchorButton>
                  )
                )}
              </Grid>
            </Stack>
          </>
        ) : (
          <>
            <button onClick={() => showWallets(selectedNetwork, selectedWallet)}>Back</button>
            <SubstrateAccounts onClose={close} />
          </>
        )}
      </Stack>
    </Dialog>
  )
}

function getWalletLabel(wallet: EvmConnectorMeta | Wallet) {
  if ('connector' in wallet && wallet.connector instanceof MetaMask)
    return !wallet.installed || isMetaMaskWallet() ? wallet.title : 'Browser Wallet'
  return wallet.title
}
function getWalletIcon(wallet: EvmConnectorMeta | Wallet) {
  if ('connector' in wallet && wallet.connector instanceof MetaMask)
    return !wallet.installed || isMetaMaskWallet() ? wallet.logo.src : ''
  return wallet.logo.src
}

const PROXY_TYPE_LABELS = {
  Any: 'Any rights',
  Borrow: 'Borrower',
  Invest: 'Investor',
  Price: 'Pricing',
}

function SubstrateAccounts({ onClose }: { onClose: () => void }) {
  const {
    substrate: { accounts, selectAccount, selectProxy, selectedAccount, proxy, proxies },
  } = useWallet()
  if (!accounts) return null
  return (
    <>
      <Menu>
        {accounts.map((acc) => (
          <MenuItemGroup key={acc.address}>
            <MenuItem
              label={
                acc.name ? (
                  <Text
                    style={{
                      display: 'block',
                      maxWidth: '250px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {acc.name}
                  </Text>
                ) : (
                  truncateAddress(acc.address)
                )
              }
              sublabel={acc.address}
              icon={
                <IdenticonWrapper>
                  <Identicon value={acc.address} size={24} theme="polkadot" />
                </IdenticonWrapper>
              }
              iconRight={selectedAccount?.address === acc.address && !proxy ? IconCheck : <Box width={16} />}
              onClick={() => {
                onClose()
                selectAccount(acc.address)
              }}
            />
            {proxies?.[acc.address]?.map((p) => (
              <MenuItem
                label={
                  <Shelf alignItems="baseline" gap="5px">
                    <Text
                      variant="interactive2"
                      color="inherit"
                      style={{
                        maxWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {acc.name || truncateAddress(acc.address)}
                    </Text>
                    <span>/</span>
                    <span>{truncateAddress(p.delegator)}</span>
                    <Text variant="label2">
                      {p.types.map((type) => (PROXY_TYPE_LABELS as any)[type] ?? type).join(' / ')}
                    </Text>
                  </Shelf>
                }
                sublabel={p.delegator}
                key={p.delegator}
                icon={
                  <IdenticonWrapper>
                    <Identicon value={p.delegator} size={24} theme="polkadot" />
                  </IdenticonWrapper>
                }
                iconRight={
                  selectedAccount?.address === acc.address && proxy?.delegator === p.delegator ? (
                    IconCheck
                  ) : (
                    <Box width={16} />
                  )
                }
                onClick={() => {
                  onClose()
                  if (acc.address !== selectedAccount?.address) selectAccount(acc.address)
                  selectProxy(p.delegator)
                }}
              />
            ))}
          </MenuItemGroup>
        ))}
      </Menu>
    </>
  )
}

const IdenticonWrapper = styled.div`
  pointer-events: none;
`
