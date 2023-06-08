import {
  Box,
  Button,
  Card,
  Dialog,
  IconAlertCircle,
  IconArrowRight,
  IconChevronLeft,
  IconDownload,
  MenuItemGroup,
  Stack,
  Text,
} from '@centrifuge/fabric'
import centrifugeLogo from '@centrifuge/fabric/assets/logos/centrifuge.svg'
import { Wallet } from '@subwallet/wallet-connect/types'
import { MetaMask } from '@web3-react/metamask'
import * as React from 'react'
import { AccountButton, AccountIcon, AccountName } from './AccountButton'
import { EvmChains, getChainInfo } from './evm/chains'
import { EvmConnectorMeta } from './evm/connectors'
import { isMetaMaskWallet } from './evm/utils'
import { Logo, SelectAnchor, SelectButton } from './SelectButton'
import { SelectionStep, SelectionStepTooltip } from './SelectionStep'
import { UserSelection } from './UserSelection'
import { sortCentrifugeWallets, sortEvmWallets, useGetNetworkName } from './utils'
import { useCentEvmChainId, useWallet, wallets } from './WalletProvider'

type Props = {
  evmChains: EvmChains
  showAdvancedAccounts?: boolean
}

const title = {
  accounts: 'Choose account',
  wallets: 'Connect wallet',
}

export function WalletDialog({ evmChains, showAdvancedAccounts }: Props) {
  const ctx = useWallet()
  const centEvmChainId = useCentEvmChainId()
  const {
    pendingConnect: { isConnecting, wallet: pendingWallet, isError: isConnectError },
    walletDialog: { view, network: selectedNetwork, wallet: selectedWallet },
    dispatch,
    showWallets,
    connect: doConnect,
    evm,
    scopedNetworks,
    substrate: { evmChainId },
  } = ctx

  const getNetworkName = useGetNetworkName()

  const isCentChainSelected = selectedNetwork === 'centrifuge' || selectedNetwork === evmChainId

  const sortedEvmWallets = sortEvmWallets(evm.connectors.filter((c) => c.shown))
  const centWallets = centEvmChainId
    ? [...sortCentrifugeWallets(wallets), ...sortedEvmWallets]
    : sortCentrifugeWallets(wallets)
  const shownWallets = isCentChainSelected ? centWallets : selectedNetwork ? sortedEvmWallets : []

  function close() {
    dispatch({ type: 'closeWalletDialog' })
  }

  async function connect(wallet: Wallet | EvmConnectorMeta) {
    try {
      const accounts = await doConnect(wallet, selectedNetwork!)
      if (accounts?.length! > 1 && 'extensionName' in wallet) {
        dispatch({ type: 'showWalletDialogAccounts' })
      } else {
        close()
      }
    } catch {
      //
    }
  }

  function walletButtonMuted() {
    return Boolean(
      scopedNetworks &&
        ((isCentChainSelected && !scopedNetworks.includes('centrifuge')) ||
          (typeof selectedNetwork === 'number' && !scopedNetworks.includes(selectedNetwork)))
    )
  }

  return (
    <Dialog title={view ? title[view] : undefined} isOpen={!!view} onClose={close}>
      <Stack gap={4}>
        <UserSelection network={selectedNetwork} wallet={selectedWallet} />

        {view === 'wallets' ? (
          <>
            <SelectionStep
              step={1}
              title="Choose network"
              tooltip={scopedNetworks && <SelectionStepTooltip networks={scopedNetworks} />}
            >
              <SelectButton
                logo={<Logo icon={centrifugeLogo} />}
                onClick={() => showWallets('centrifuge')}
                active={isCentChainSelected}
                muted={Boolean(scopedNetworks && !scopedNetworks.includes('centrifuge'))}
              >
                {getNetworkName('centrifuge')}
              </SelectButton>

              {Object.entries(evmChains).map(([chainId, chain]) => {
                const info = getChainInfo(evmChains, Number(chainId))

                if (Number(chainId) === evmChainId) return null

                return (
                  <SelectButton
                    key={chainId}
                    logo={chain.iconUrl ? <Logo icon={chain.iconUrl} /> : undefined}
                    onClick={() => showWallets(Number(chainId))}
                    active={selectedNetwork === Number(chainId)}
                    muted={Boolean(scopedNetworks && scopedNetworks.includes('centrifuge'))}
                  >
                    {info.name}
                  </SelectButton>
                )
              })}
            </SelectionStep>

            <Box as="hr" borderStyle="solid" borderWidth={0} borderTopWidth={1} borderColor="borderPrimary" />

            <SelectionStep step={2} title="Choose wallet" disabled={!(shownWallets?.length > 0)}>
              {shownWallets.map((wallet) =>
                wallet.installed ? (
                  <SelectButton
                    key={wallet.title}
                    logo={<Logo icon={getWalletIcon(wallet)} />}
                    iconRight={
                      selectedWallet && isConnectError && selectedWallet === wallet ? (
                        <IconAlertCircle size="iconSmall" />
                      ) : undefined
                    }
                    onClick={() => {
                      showWallets(selectedNetwork, wallet)
                      connect(wallet)
                    }}
                    loading={isConnecting && wallet === pendingWallet}
                    active={selectedWallet === wallet}
                    muted={walletButtonMuted()}
                  >
                    {getWalletLabel(wallet)}
                  </SelectButton>
                ) : (
                  <SelectAnchor
                    key={wallet.title}
                    href={wallet.installUrl}
                    logo={<Logo icon={getWalletIcon(wallet)} />}
                    iconRight={<IconDownload size="iconSmall" color="textPrimary" />}
                    muted={walletButtonMuted()}
                  >
                    {getWalletLabel(wallet)}
                  </SelectAnchor>
                )
              )}
            </SelectionStep>

            <Text as="p" variant="body3" textAlign="center">
              Need help connecting a wallet?{' '}
              <Text
                as="a"
                href="https://docs.centrifuge.io/use/setup-wallet/"
                target="_blank"
                rel="noopener noreferrer"
                textDecoration="underline"
              >
                Read our FAQ
              </Text>
            </Text>
          </>
        ) : (
          <>
            <SubstrateAccounts onClose={close} showAdvancedAccounts={showAdvancedAccounts} />

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
    return !wallet.installed || isMetaMaskWallet() ? wallet.logo.src : IconArrowRight
  }
  return wallet.logo.src
}

const PROXY_TYPE_LABELS = {
  Any: 'Any rights',
  Borrow: 'Borrower',
  Invest: 'Investor',
  Price: 'Pricing',
  PodAuth: 'POD Authentication',
  PermissionManagement: 'Manage permissions',
}

function SubstrateAccounts({ onClose, showAdvancedAccounts }: { onClose: () => void; showAdvancedAccounts?: boolean }) {
  const {
    substrate: { combinedAccounts, selectAccount, selectedCombinedAccount, selectedAddress },
  } = useWallet()

  if (!combinedAccounts) return null

  return (
    <>
      <Card maxHeight="50vh" style={{ overflow: 'auto' }}>
        {combinedAccounts
          .filter((acc) => showAdvancedAccounts || (!acc.proxies && !acc.multisig))
          .map((acc) => {
            const actingAddress = acc.proxies?.at(-1)?.delegator || acc.multisig?.address || acc.signingAccount.address
            return (
              <React.Fragment key={acc.signingAccount.address}>
                <MenuItemGroup>
                  <AccountButton
                    address={actingAddress}
                    icon={<AccountIcon id={actingAddress} />}
                    label={<AccountName account={acc.signingAccount} proxies={acc.proxies} />}
                    onClick={() => {
                      onClose()
                      selectAccount(
                        acc.signingAccount.address,
                        acc.proxies?.map((p) => p.delegator),
                        acc.multisig?.address
                      )
                    }}
                    selected={
                      acc === selectedCombinedAccount ||
                      (!selectedCombinedAccount &&
                        selectedAddress === acc.signingAccount.address &&
                        !acc.multisig &&
                        !acc.proxies)
                    }
                    proxyRights={acc.proxies?.[0].types
                      .map((type) => (PROXY_TYPE_LABELS as any)[type] ?? type)
                      .join(' / ')}
                    multisig={acc.multisig}
                  />
                </MenuItemGroup>
              </React.Fragment>
            )
          })}
      </Card>
    </>
  )
}
