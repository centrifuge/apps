import {
  Box,
  Button,
  Card,
  Dialog,
  IconAlertCircle,
  IconChevronLeft,
  IconDownload,
  MenuItemGroup,
  Stack,
} from '@centrifuge/fabric'
import centrifugeLogo from '@centrifuge/fabric/assets/logos/centrifuge.svg'
import { Wallet } from '@subwallet/wallet-connect/types'
import { MetaMask } from '@web3-react/metamask'
import * as React from 'react'
import { AccountButton, AccountIcon, AccountName } from './AccountButton'
import { EvmChains } from './evm/chains'
import { EvmConnectorMeta } from './evm/connectors'
import { isMetaMaskWallet } from './evm/utils'
import { Logo, SelectAnchor, SelectButton } from './SelectButton'
import { SelectionStep } from './SelectionStep'
import { UserSelection } from './UserSelection'
import { useWallet, wallets } from './WalletProvider'

type Props = {
  evmChains: EvmChains
}

const title = {
  accounts: 'Choose Account',
  wallets: 'Choose wallet',
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
    selectedNetwork === 'centrifuge' ? [...wallets] : selectedNetwork ? [...evm.connectors] : []
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
    } catch {
      //
    }
  }

  return (
    <Dialog title={view ? title[view] : undefined} isOpen={!!view} onClose={close}>
      <Stack gap={4}>
        <UserSelection network={selectedNetwork} wallet={selectedWallet} />

        {view === 'wallets' ? (
          <>
            <SelectionStep step={1} title="Network">
              <SelectButton
                logo={<Logo src={centrifugeLogo} />}
                onClick={() => showWallets('centrifuge')}
                active={selectedNetwork === 'centrifuge'}
              >
                Centrifuge
              </SelectButton>

              {Object.entries(evmChains).map(([chainId, chain]) => (
                <SelectButton
                  key={chainId}
                  logo={chain.logo?.src ? <Logo src={chain.logo.src} /> : undefined}
                  onClick={() => showWallets(Number(chainId))}
                  active={selectedNetwork === Number(chainId)}
                >
                  {chain.name}
                </SelectButton>
              ))}
            </SelectionStep>

            <Box as="hr" borderStyle="solid" borderWidth={0} borderTopWidth={1} borderColor="borderPrimary" />

            <SelectionStep step={2} title="Wallet" disabled={!(shownWallets?.length > 0)}>
              {shownWallets.map((wallet) =>
                wallet.installed ? (
                  <SelectButton
                    key={wallet.title}
                    logo={<Logo src={getWalletIcon(wallet)} />}
                    iconRight={
                      selectedWallet && isConnectError && selectedWallet === wallet ? (
                        <IconAlertCircle size="iconSmall" />
                      ) : undefined
                    }
                    onClick={() => {
                      showWallets(selectedNetwork, wallet)
                      connect(wallet)
                    }}
                    disabled={!isEnabled(wallet)}
                    loading={isConnecting && wallet === pendingWallet}
                    active={ctx[connectedType!]?.selectedWallet === wallet}
                  >
                    {getWalletLabel(wallet)}
                  </SelectButton>
                ) : (
                  <SelectAnchor
                    key={wallet.title}
                    href={wallet.installUrl}
                    logo={<Logo src={getWalletIcon(wallet)} />}
                    iconRight={<IconDownload size="iconSmall" color="textPrimary" />}
                    disabled={!isEnabled(wallet)}
                  >
                    {getWalletLabel(wallet)}
                  </SelectAnchor>
                )
              )}
            </SelectionStep>
          </>
        ) : (
          <>
            <SubstrateAccounts onClose={close} />

            <Box mt={1}>
              <Button
                variant="secondary"
                icon={IconChevronLeft}
                onClick={() => showWallets(selectedNetwork, selectedWallet)}
                small
              >
                Back
              </Button>
            </Box>
          </>
        )}
      </Stack>
    </Dialog>
  )
}

export function getWalletLabel(wallet: EvmConnectorMeta | Wallet) {
  if ('connector' in wallet && wallet.connector instanceof MetaMask) {
    return !wallet.installed || isMetaMaskWallet() ? wallet.title : 'Browser Wallet'
  }
  return wallet.title
}

export function getWalletIcon(wallet: EvmConnectorMeta | Wallet) {
  if ('connector' in wallet && wallet.connector instanceof MetaMask) {
    return !wallet.installed || isMetaMaskWallet() ? wallet.logo.src : ''
  }
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
      <Card maxHeight="50vh" style={{ overflow: 'auto' }}>
        {accounts.map((acc) => (
          <React.Fragment key={acc.address}>
            <MenuItemGroup>
              <AccountButton
                address={acc.address}
                icon={<AccountIcon id={acc.address} />}
                label={<AccountName account={acc} />}
                onClick={() => {
                  onClose()
                  selectAccount(acc.address)
                }}
                selected={selectedAccount?.address === acc.address && !proxy}
              />
            </MenuItemGroup>

            {proxies?.[acc.address]?.map((p, index) => (
              <MenuItemGroup key={`${p.delegator}${index}`}>
                <AccountButton
                  address={acc.address}
                  icon={<AccountIcon id={p.delegator} />}
                  label={<AccountName account={acc} delegator={p.delegator} />}
                  proxyRights={p.types.map((type) => (PROXY_TYPE_LABELS as any)[type] ?? type).join(' / ')}
                  onClick={() => {
                    onClose()
                    if (acc.address !== selectedAccount?.address) selectAccount(acc.address)
                    selectProxy(p.delegator)
                  }}
                  selected={selectedAccount?.address === acc.address && proxy?.delegator === p.delegator}
                />
              </MenuItemGroup>
            ))}
          </React.Fragment>
        ))}
      </Card>
    </>
  )
}
