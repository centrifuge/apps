import { getSupportedBrowser } from '@centrifuge/centrifuge-app/src/utils/getSupportedBrowser'
import { Box, Card, Dialog, Grid, IconAlertCircle, IconDownload, MenuItemGroup, Stack, Text } from '@centrifuge/fabric'
import centrifugeLogo from '@centrifuge/fabric/assets/logos/centrifuge.svg'
import { Wallet } from '@subwallet/wallet-connect/types'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { Network } from '.'
import { AccountButton, AccountIcon, AccountName } from './AccountButton'
import { Logo, SelectAnchor, SelectButton } from './SelectButton'
import { SelectionStep, SelectionStepTooltip } from './SelectionStep'
import { useCentEvmChainId, useWallet, wallets } from './WalletProvider'
import { EvmChains, getChainInfo } from './evm/chains'
import { EvmConnectorMeta } from './evm/connectors'
import { sortCentrifugeWallets, sortEvmWallets, useGetNetworkName } from './utils'

type Props = {
  evmChains: EvmChains
  showAdvancedAccounts?: boolean
  showTestNets?: boolean
  showFinoa?: boolean
}

type WalletFn = {
  installUrl: string
  extensionName?: string
}

const title = {
  networks: 'Connect wallet',
  wallets: 'Connect wallet',
  accounts: 'Choose account',
}

const walletsList: { [key: string]: string } = {
  talisman: 'talisman-wallet-extension',
  'subwallet-js': 'subwallet',
  'polkadot-js': 'polkadot-js-extension',
  'fearless-wallet': 'fearless-wallet',
  metamask: 'ether-metamask',
}

const getAdjustedInstallUrl = (wallet: WalletFn): string => {
  const browser = getSupportedBrowser()
  const { installUrl } = wallet
  if (browser === 'firefox') {
    const extensionName = wallet.extensionName ?? 'metamask'
    return `https://addons.mozilla.org/en-US/firefox/addon/${walletsList[extensionName]}/`
  } else {
    return installUrl
  }
}

export function WalletDialog({ evmChains: allEvmChains, showAdvancedAccounts, showTestNets, showFinoa }: Props) {
  const [step, setStep] = React.useState(1)
  const evmChains = Object.keys(allEvmChains)
    .filter((chainId) => (!showTestNets ? !(allEvmChains as any)[chainId].isTestnet : true))
    .reduce((obj, chainId) => {
      obj[chainId] = (allEvmChains as any)[chainId]
      return obj
    }, {} as any) as EvmChains
  const ctx = useWallet()
  const centEvmChainId = useCentEvmChainId()
  const {
    connectedType,
    pendingConnect: { isConnecting, wallet: pendingWallet, isError: isConnectError },
    walletDialog: { view, network: selectedNetwork, wallet: selectedWallet },
    dispatch,
    showWallets,
    connect: doConnect,
    evm,
    scopedNetworks,
    substrate: { evmChainId, selectedAddress },
  } = ctx

  const getNetworkName = useGetNetworkName()

  const isCentChainSelected = selectedNetwork === 'centrifuge' || selectedNetwork === evmChainId

  const sortedEvmWallets = sortEvmWallets(
    evm.connectors.filter((c) => (c.id !== 'finoa' && c.shown) || (c.id === 'finoa' && showFinoa))
  )
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

  function isMuted(network: Network) {
    if (!scopedNetworks) return false
    return !scopedNetworks.includes(network)
  }

  return (
    <Dialog
      title={view ? title[view] : undefined}
      isOpen={!!view}
      onClose={close}
      subtitle="Choose your network and wallet to connect with Centrifuge"
    >
      <Stack gap={3}>
        <SelectionStep
          title="Step 1: Choose network"
          tooltip={scopedNetworks && <SelectionStepTooltip networks={scopedNetworks} />}
          done={!!selectedNetwork}
          expanded={step === 1}
          toggleExpanded={() => setStep(step === 1 ? 0 : 1)}
        >
          <Grid minColumnWidth={120} mt={3} gap={1}>
            {/* ethereum mainnet */}
            <SelectButton
              key={1}
              logo={evmChains['1']?.iconUrl ? <Logo icon={evmChains['1'].iconUrl} /> : undefined}
              onClick={() => {
                showWallets(1)
                setStep(2)
              }}
              active={selectedNetwork === 1}
              muted={isMuted(1)}
            >
              {getChainInfo(evmChains, 1).name}
            </SelectButton>

            <SelectButton
              logo={<Logo icon={centrifugeLogo} />}
              onClick={() => {
                showWallets('centrifuge')
                setStep(2)
              }}
              active={isCentChainSelected}
              muted={isMuted('centrifuge')}
            >
              {getNetworkName('centrifuge')}
            </SelectButton>

            {Object.entries(evmChains)
              .filter((evmChain) => evmChain[0] !== '1')
              .map(([chainIdString, chain]) => {
                const chainId = Number(chainIdString)
                const info = getChainInfo(evmChains, chainId)

                if (chainId === evmChainId) return null

                return (
                  <SelectButton
                    key={chainId}
                    logo={chain.iconUrl ? <Logo icon={chain.iconUrl} /> : undefined}
                    onClick={() => {
                      showWallets(chainId)
                      setStep(2)
                    }}
                    active={selectedNetwork === chainId}
                    muted={isMuted(chainId)}
                  >
                    {info.name}
                  </SelectButton>
                )
              })}
          </Grid>
        </SelectionStep>

        <SelectionStep
          title="Step 2: Choose wallet"
          done={!!selectedWallet}
          expanded={step === 2}
          toggleExpanded={() => setStep(step === 2 ? 0 : 2)}
          disabled={!shownWallets.length}
        >
          <Grid minColumnWidth={120} mt={3} gap={1} borderColor="transparent">
            {shownWallets.map((wallet) => {
              return wallet.installed ? (
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
                    setStep(3)
                  }}
                  loading={isConnecting && wallet === pendingWallet}
                  active={selectedWallet === wallet}
                  muted={isMuted(selectedNetwork!)}
                >
                  {wallet.title}
                </SelectButton>
              ) : (
                <SelectAnchor
                  key={wallet.title}
                  href={getAdjustedInstallUrl(wallet)}
                  logo={<Logo icon={wallet.logo.src} />}
                  iconRight={<IconDownload size="iconSmall" color="textPrimary" />}
                  muted={isMuted(selectedNetwork!)}
                >
                  {wallet.title}
                </SelectAnchor>
              )
            })}
          </Grid>
        </SelectionStep>

        {view === 'accounts' && (
          <SelectionStep
            expanded={step === 3}
            toggleExpanded={() => setStep(step === 3 ? 0 : 3)}
            title="Step 3: Choose account"
            tooltip={scopedNetworks && <SelectionStepTooltip networks={scopedNetworks} />}
            done={!!selectedAddress}
          >
            {connectedType === 'substrate' ? (
              <SubstrateAccounts onClose={close} showAdvancedAccounts={showAdvancedAccounts} />
            ) : null}
          </SelectionStep>
        )}

        <Text as="p" variant="body2" textAlign="center" color="textSecondary" fontWeight={600}>
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
  PodOperation: 'POD Operation',
  PodAuth: 'POD Authentication',
  PermissionManagement: 'Manage permissions',
}

function SubstrateAccounts({ onClose, showAdvancedAccounts }: { onClose: () => void; showAdvancedAccounts?: boolean }) {
  const theme = useTheme()
  const {
    substrate: { combinedAccounts, selectAccount, selectedCombinedAccount, selectedAddress },
  } = useWallet()

  if (!combinedAccounts) return null

  return (
    <>
      <Card maxHeight="50vh" style={{ overflow: 'auto', borderColor: 'transparent' }} mt={3}>
        {combinedAccounts
          .filter((acc) => showAdvancedAccounts || (!acc.proxies && !acc.multisig))
          .map((acc, index) => {
            const actingAddress = acc.proxies?.at(-1)?.delegator || acc.multisig?.address || acc.signingAccount.address
            return (
              <MenuItemGroup key={`${acc.signingAccount.address}${index}`} hideDivider>
                <Box borderBottom={`0.5px solid ${theme.colors.borderSecondary}`}>
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
                </Box>
              </MenuItemGroup>
            )
          })}
      </Card>
    </>
  )
}
