import {
  Button,
  Card,
  Dialog,
  Divider,
  Grid,
  IconAlertCircle,
  IconDownload,
  IconEdit,
  IconExternalLink,
  MenuItemGroup,
  Shelf,
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
import { isSubWallet, isTalismanWallet } from './evm/utils'
import { Logo, NetworkIcon, SelectAnchor, SelectButton } from './SelectButton'
import { SelectionStep, SelectionStepTooltip } from './SelectionStep'
import { sortCentrifugeWallets, sortEvmWallets, useGetNetworkName } from './utils'
import { useCentEvmChainId, useWallet, wallets } from './WalletProvider'

type Props = {
  evmChains: EvmChains
  showAdvancedAccounts?: boolean
  showBase?: boolean
}

const title = {
  networks: 'Connect wallet',
  wallets: 'Connect wallet',
  accounts: 'Choose account',
}

export function WalletDialog({ evmChains: allEvmChains, showAdvancedAccounts, showBase }: Props) {
  const evmChains = Object.keys(allEvmChains)
    .filter((chain) => (!showBase ? !['8453', '84531'].includes(chain) : true))
    .reduce((obj, key) => {
      obj[key] = allEvmChains[key]
      return obj
    }, {}) as EvmChains
  const ctx = useWallet()
  const centEvmChainId = useCentEvmChainId()
  const {
    pendingConnect: { isConnecting, wallet: pendingWallet, isError: isConnectError },
    walletDialog: { view, network: selectedNetwork, wallet: selectedWallet },
    dispatch,
    showNetworks,
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
    <Dialog
      title={view ? title[view] : undefined}
      isOpen={!!view}
      onClose={close}
      subtitle={view === 'networks' ? 'Choose your network and wallet to connect with Centrifuge' : undefined}
    >
      <Stack gap={3}>
        <SelectionStep
          step={1}
          title="Choose network"
          tooltip={scopedNetworks && <SelectionStepTooltip networks={scopedNetworks} />}
          expanded={view === 'networks'}
          titleElement={
            selectedNetwork && (
              <Shelf gap={1}>
                <NetworkIcon size="iconSmall" network={selectedNetwork} />
                <Text variant="body2">{getNetworkName(selectedNetwork)}</Text>
              </Shelf>
            )
          }
          rightElement={
            view !== 'networks' && (
              <Button variant="tertiary" small icon={IconEdit} onClick={() => showNetworks(selectedNetwork)}>
                Change network
              </Button>
            )
          }
        >
          <Grid minColumnWidth={120} mt={3} gap={1}>
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
          </Grid>
        </SelectionStep>

        {(!!selectedWallet || view === 'wallets' || view === 'accounts') && (
          <>
            <Divider />
            <SelectionStep
              step={2}
              title="Choose wallet"
              expanded={view === 'wallets'}
              titleElement={
                selectedWallet && (
                  <Shelf gap={1}>
                    <Logo icon={selectedWallet.logo.src} size="iconSmall" />
                    <Text variant="body2">{selectedWallet.title}</Text>
                  </Shelf>
                )
              }
              rightElement={
                view === 'accounts' && (
                  <Button
                    variant="tertiary"
                    small
                    icon={IconEdit}
                    onClick={() => showWallets(selectedNetwork, selectedWallet)}
                  >
                    Change wallet
                  </Button>
                )
              }
            >
              <Grid minColumnWidth={120} mt={3} gap={1}>
                {shownWallets.map((wallet) =>
                  wallet.installed ? (
                    <SelectButton
                      key={wallet.title}
                      logo={<Logo icon={wallet.logo.src} />}
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
                      {wallet.title}
                    </SelectButton>
                  ) : (
                    <SelectAnchor
                      key={wallet.title}
                      href={wallet.installUrl}
                      logo={<Logo icon={wallet.logo.src} />}
                      iconRight={<IconDownload size="iconSmall" color="textPrimary" />}
                      muted={walletButtonMuted()}
                    >
                      {wallet.title}
                    </SelectAnchor>
                  )
                )}
              </Grid>
            </SelectionStep>
          </>
        )}

        {view === 'accounts' && (
          <>
            <Divider />
            <SelectionStep
              step={3}
              title="Choose account"
              tooltip={scopedNetworks && <SelectionStepTooltip networks={scopedNetworks} />}
              rightElement={
                selectedWallet &&
                'extensionName' in selectedWallet &&
                ((selectedWallet.extensionName === 'subwallet-js' && isSubWallet()) ||
                  (selectedWallet.extensionName === 'talisman' && isTalismanWallet())) && (
                  <Button
                    variant="tertiary"
                    small
                    icon={IconExternalLink}
                    onClick={() => {
                      const wallet = evm.connectors.find((c) => c.connector instanceof MetaMask)!
                      showWallets(selectedNetwork, wallet)
                      connect(wallet)
                    }}
                  >
                    Use EVM Account
                  </Button>
                )
              }
            >
              <SubstrateAccounts onClose={close} showAdvancedAccounts={showAdvancedAccounts} />
            </SelectionStep>
          </>
        )}

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
      </Stack>
    </Dialog>
  )
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
      <Card maxHeight="50vh" style={{ overflow: 'auto' }} mt={3}>
        {combinedAccounts
          .filter((acc) => showAdvancedAccounts || (!acc.proxies && !acc.multisig))
          .map((acc, index) => {
            const actingAddress = acc.proxies?.at(-1)?.delegator || acc.multisig?.address || acc.signingAccount.address
            return (
              <MenuItemGroup key={`${acc.signingAccount.address}${index}`}>
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
            )
          })}
      </Card>
    </>
  )
}
