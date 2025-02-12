import { Button, Card, CurrencyInput, Shelf, Spinner, Stack, Text } from '@centrifuge/fabric'
import { Vault } from '@centrifuge/sdk'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useCentrifugeTransaction } from '../hooks/useCentrifugeTransaction'
import { useActiveNetworks, useVaultInvestment, useVaults } from '../hooks/usePool'
import { ConnectionGuard } from './ConnectionGuard'

const poolId = '2779829532'
const trancheId = '0xac6bffc5fd68f7772ceddec7b0a316ca'

export function Invest() {
  const { data: networks, isLoading } = useActiveNetworks(poolId)
  return (
    <Card alignSelf="center" p={2} backgroundColor="backgroundSecondary">
      <Stack gap={2}>
        {isLoading ? (
          <Shelf justifyContent="center">
            <Spinner />
          </Shelf>
        ) : (
          <>
            <Text variant="heading1">Invest</Text>
            <ConnectionGuard networks={networks?.map((n) => n.chainId) || []}>
              <InvestInner />
            </ConnectionGuard>
          </>
        )}
      </Stack>
    </Card>
  )
}

function InvestInner() {
  const { address } = useAccount()
  const { data: vaults } = useVaults(poolId, trancheId, 11155111)
  const { execute: executeClaim, isLoading: isClaiming } = useCentrifugeTransaction()
  const { execute: executeInvest, isLoading: isInvesting } = useCentrifugeTransaction()
  const [selectedVault, setVault] = useState<Vault>()
  const [amount, setAmount] = useState<number | ''>(0)

  useEffect(() => {
    if (vaults?.length && (!selectedVault || !vaults.includes(selectedVault))) {
      setVault(vaults[0])
    }
  }, [vaults])

  function submit() {
    if (!selectedVault || !amount) return
    executeInvest(selectedVault.increaseInvestOrder(amount))
  }

  function claim() {
    if (!selectedVault) return
    executeClaim(selectedVault.claim())
  }

  const { data: investment } = useVaultInvestment(selectedVault, address)

  return (
    <>
      {investment?.isAllowedToInvest === false && (
        <Text variant="body2" color="statusCritical">
          You are not allowed to invest in this vault
        </Text>
      )}
      {investment?.pendingInvestCurrency.gt(0n) && (
        <Text variant="body2" color="statusWarning">
          You have a pending investment of {investment.pendingInvestCurrency.toFloat().toFixed(2)}{' '}
          {investment.investmentCurrency.symbol}
        </Text>
      )}
      {(investment?.claimableInvestShares.gt(0n) || investment?.claimableCancelInvestCurrency.gt(0n)) && (
        <Stack gap={1}>
          <Text variant="body2" color="statusWarning">
            You have claimable shares or pending cancelation
          </Text>
          <Button loading={isClaiming} onClick={claim} small>
            Claim
          </Button>
        </Stack>
      )}
      <CurrencyInput
        value={amount}
        onChange={(value) => setAmount(value)}
        label="Amount"
        currency={investment?.investmentCurrency.symbol}
        secondaryLabel={`${investment?.investmentCurrencyBalance.toFloat().toFixed(2)} balance`}
        disabled={
          investment?.isAllowedToInvest === false ||
          investment?.claimableInvestShares.gt(0n) ||
          investment?.claimableCancelInvestCurrency.gt(0n)
        }
      />
      <Button onClick={submit} disabled={!amount} loading={isInvesting}>
        Invest
      </Button>
    </>
  )
}
