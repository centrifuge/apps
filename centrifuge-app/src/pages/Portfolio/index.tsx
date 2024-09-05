import { evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { useWallet } from '@centrifuge/centrifuge-react'
import { Button, Stack, Text } from '@centrifuge/fabric'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { AssetAllocation } from '../../components/Portfolio/AssetAllocation'
import { CardPortfolioValue } from '../../components/Portfolio/CardPortfolioValue'
import { Holdings } from '../../components/Portfolio/Holdings'
import { Transactions } from '../../components/Portfolio/Transactions'
import { RouterLinkButton } from '../../components/RouterLinkButton'
import { isEvmAddress } from '../../utils/address'
import { useAddress } from '../../utils/useAddress'
import { useTransactionsByAddress } from '../../utils/usePools'

export default function PortfolioPage() {
  return <Portfolio />
}

function Portfolio() {
  const address = useAddress()
  const transactions = useTransactionsByAddress(address)
  const { showNetworks, connectedNetwork, evm } = useWallet()
  const chainId = evm.chainId ?? undefined
  const centAddress = address && chainId && isEvmAddress(address) ? evmToSubstrateAddress(address, chainId) : address

  return (
    <>
      <LayoutSection backgroundColor="backgroundSecondary" pt={5} pb={3}>
        <Stack as="header" gap={1}>
          <Text as="h1" variant="heading1">
            Your portfolio
          </Text>
          <Text as="p" variant="label1">
            Track and manage your portfolio
          </Text>
        </Stack>
        <CardPortfolioValue address={address} chainId={chainId} showGraph={false} />
      </LayoutSection>

      {transactions?.investorTransactions.length === 0 && connectedNetwork === 'centrifuge' ? (
        <LayoutSection>
          <Stack maxWidth="700px" gap={2}>
            <Text variant="body2">
              The portfolio page is empty as there are no investments available for display at the moment. Go explore
              some pools on Centrifuge, where you can earn yield from real-world assets.
            </Text>
            <RouterLinkButton style={{ display: 'inline-flex' }} variant="primary" to="/pools">
              View pools
            </RouterLinkButton>
          </Stack>
        </LayoutSection>
      ) : null}

      {!address && (
        <LayoutSection>
          <Stack maxWidth="700px" gap={2}>
            <Text variant="body2">To view your investments, you need to connect your wallet.</Text>
            <Button style={{ display: 'inline-flex' }} variant="primary" onClick={() => showNetworks()}>
              Connect wallet
            </Button>
          </Stack>
        </LayoutSection>
      )}

      <LayoutSection title="Holdings">
        <Holdings address={address} chainId={chainId} />
      </LayoutSection>

      <LayoutSection title="Transaction history">
        <Transactions onlyMostRecent address={centAddress} />
      </LayoutSection>

      <LayoutSection title="Allocation" pb={5}>
        <AssetAllocation address={address} chainId={chainId} />
      </LayoutSection>
    </>
  )
}
