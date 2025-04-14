import {
  ConnectionGuard,
  useAddress,
  useBalances,
  useCentrifugeApi,
  useCentrifugeTransaction,
} from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, Divider, Grid, IconClock, IconInfo, Text, TextInput } from '@centrifuge/fabric'
import { BrowserProvider, getAddress, verifyMessage } from 'ethers'
import { useEffect, useState } from 'react'
import { firstValueFrom, switchMap } from 'rxjs'
import styled, { useTheme } from 'styled-components'
import { useDebugFlags } from '../../../src/components/DebugFlags'
import { LayoutSection } from '../../../src/components/LayoutBase/LayoutSection'
import { Tooltips } from '../../../src/components/Tooltips'
import { isTestEnv } from '../../../src/config'
import { Dec } from '../../../src/utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useCFGTokenPrice } from '../../utils/useCFGTokenPrice'
import { TooltipText } from './CFGTokenMigration'
import MigrationSuccessPage from './MigrationSuccessPage'
import { useAxelarStatusPoller } from './useAxelarStatus'
import { TransactionData, useRecordTransaction } from './useRecordTransaction'

const StyledButton = styled(Box)<{ disabled: boolean }>`
  background-color: ${({ theme }) => theme.colors.textPrimary};
  color: white;
  border-radius: 4px;
  font-size: 12px;
  border: transparent;
  margin-top: 25px;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  height: 40px;
  padding: 4px 8px;
`

const Header = () => {
  return (
    <>
      <Grid gridTemplateColumns="1fr 24px" alignItems="center" mb={2}>
        <Text variant="heading2">CFG - Migration</Text>
        <Tooltips type="nav" placement="bottom" label={<IconInfo size="iconSmall" />} body={<TooltipText />} />
      </Grid>
      <Divider color="borderSecondary" />
    </>
  )
}

export default function CFGTokenMigrationCent() {
  const api = useCentrifugeApi()
  const debug = useDebugFlags()
  const theme = useTheme()
  const { recordTransaction } = useRecordTransaction()
  const address = useAddress()!
  const balances = useBalances(address)
  const balance = balances?.native.balance.toDecimal() || Dec(0)
  const CFGPrice = useCFGTokenPrice()
  const wcfgValue = balance ? balance.mul(Dec(CFGPrice || 0)) : Dec(0)

  const [evmAddress, setEvmAddress] = useState<string>('')
  const [isAddressValid, setIsAddressValid] = useState<boolean>(false)
  const [isLoadingVerification, setIsLoadingVerification] = useState<boolean>(false)
  const [axelarHash, setAxelarHash] = useState<string>('')
  const [step, setStep] = useState<number>(0)
  const [initialTokenBalance, setInitialTokenBalance] = useState<number>()

  useEffect(() => {
    if (!initialTokenBalance) {
      setInitialTokenBalance(balance?.toNumber())
    }
  }, [balance, initialTokenBalance])

  useEffect(() => {
    const getAddressFromWallet = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        setEvmAddress(address)
      } catch (err) {
        console.error('Could not get EVM address:', err)
      }
    }

    getAddressFromWallet()
  }, [])

  // Check if the migration has been completed
  useAxelarStatusPoller({
    isActive: step === 2,
    onSuccess: () => {
      setStep(3)
      localStorage.removeItem('axelarHash')
    },
  })

  const { execute: executeMigration, isLoading: isLoadingMigration } = useCentrifugeTransaction(
    'Migrate CFG',
    (cent) => (_, options) => {
      return cent.getApi().pipe(
        switchMap((api) => {
          const submittable = api.tx.cfgMigration.migrate({ evm: [isTestEnv ? 11155111 : 1, evmAddress] })
          return cent.wrapSignAndSend(api, submittable, options)
        })
      )
    },
    {
      onSuccess: async (_, result) => {
        const block = await firstValueFrom(api.rpc.chain.getBlockHash(result.blockNumber))
        const apiAt = await api.at(block)
        const events = await firstValueFrom(apiAt.query.system.events())
        const event = (events as any).find(({ event }: { event: any }) => api.events.ethereum.Executed.is(event))
        if (event) {
          const eventData = event.toHuman() as any
          const axelarHash = eventData.event.data.transactionHash
          localStorage.setItem('axelarHash', axelarHash)
          setAxelarHash(axelarHash)
          setStep(2)
          const transactionData: TransactionData = {
            from_address: address,
            to_address: evmAddress,
            tx_hash: result.txHash,
            chain: 'centrifuge',
            amount: balance?.toNumber(),
          }
          await recordTransaction(transactionData)
        }
      },
    }
  )

  const migrate = async () => {
    executeMigration([])
  }

  const verifyAddress = async () => {
    setIsLoadingVerification(true)

    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const message = `Verify ownership of this address: ${evmAddress}`
      const signature = await signer.signMessage(message)
      const recoveredAddress = verifyMessage(message, signature)
      const formattedAddress = getAddress(evmAddress)
      if (recoveredAddress.toLowerCase() === formattedAddress.toLowerCase()) {
        setIsAddressValid(true)
      } else {
        setIsAddressValid(false)
      }
      setIsLoadingVerification(false)
    } catch (error) {
      console.error('Error during verification:', error)
      setIsLoadingVerification(false)
    }
  }

  const ConfirmationDetails = () => {
    return (
      <Grid
        backgroundColor="backgroundSecondary"
        border={`1px solid ${theme.colors.borderSecondary}`}
        borderRadius={8}
        p={2}
        mt={2}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        <CurrencyInput value={initialTokenBalance || 0} currency="CFG" label="Amount of CFG to migrate" disabled />
        <TextInput value={evmAddress} label="Ethereum wallet address" disabled />
      </Grid>
    )
  }

  const axelarUrl = isTestEnv
    ? `https://testnet.axelarscan.io/gmp/${axelarHash}`
    : `https://axelarscan.io/gmp/${axelarHash}`

  if (!debug.showCFGTokenMigration) {
    return null
  }

  return (
    <ConnectionGuard networks={['centrifuge']} mt={10} paddingX={12}>
      <Box mb={2}>
        <LayoutSection alignItems="flex-start">
          <Text variant="heading1">Portfolio</Text>
        </LayoutSection>
        <Box
          backgroundColor="backgroundSecondary"
          border={`1px solid ${theme.colors.borderSecondary}`}
          borderRadius={8}
          height="90vh"
          m={2}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Box
            backgroundColor="white"
            borderRadius={8}
            m={2}
            p={2}
            width={502}
            style={{
              boxShadow: '4px 8px 24px 0px #0000000D',
            }}
          >
            {step === 0 && (
              <>
                <Header />
                <Grid gridTemplateColumns="1fr 140px 140px" alignItems="center" mb={2} mt={2}>
                  <Box>
                    <Text variant="body3" color="textSecondary">
                      Position
                    </Text>
                    <Text variant="heading3">{formatBalance(balance?.toNumber(), '', 2)} CFG (Legacy)</Text>
                  </Box>
                  <Box>
                    <Text variant="body3" color="textSecondary">
                      Value
                    </Text>
                    <Text variant="heading3">{formatBalance(wcfgValue, '', 2)} USD</Text>
                  </Box>
                  <Box>
                    <Text variant="body3" color="textSecondary">
                      CFG price
                    </Text>
                    <Text variant="heading3">{formatBalance(CFGPrice || 0, '', 2)} USD</Text>
                  </Box>
                </Grid>
                <Box border={`1px solid ${theme.colors.borderSecondary}`} borderRadius={8} p={2} mb={3}>
                  <Box display="flex" flexDirection="column">
                    <CurrencyInput
                      value={balance?.toNumber()}
                      currency="CFG"
                      label="Amount of CFG (Legacy) to migrate"
                      disabled
                    />
                    <Text style={{ marginTop: 8, alignSelf: 'flex-end' }} variant="body2">
                      Wallet balance: {formatBalance(balance, '', 2)} CFG
                    </Text>
                  </Box>
                  <CurrencyInput value={balance?.toNumber()} currency="CFG" label="Amount of new CFG tokens" disabled />
                  <Grid gridTemplateColumns="1fr 1fr" alignItems="center" mt={2} gap={2} mb={2} position="relative">
                    <TextInput value={evmAddress} label="Ethereum wallet address" disabled />
                    {isAddressValid ? (
                      <Box
                        backgroundColor="statusOkBg"
                        borderRadius={4}
                        display="flex"
                        justifyContent="center"
                        marginTop={3}
                        paddingY={1}
                      >
                        <Text variant="heading4">Wallet verified</Text>
                      </Box>
                    ) : (
                      <StyledButton
                        as="button"
                        onClick={verifyAddress}
                        disabled={isLoadingVerification || !evmAddress}
                        style={{ position: 'absolute', right: 0, top: 0, width: '50%' }}
                      >
                        {isLoadingVerification ? 'Verifying...' : 'Connect wallet and sign message to verify access'}
                      </StyledButton>
                    )}
                  </Grid>
                  <CurrencyInput value={10} label="Gas fee estimate" disabled currency="CFG" />
                </Box>
                <Grid display="flex" gap={1} mb={2}>
                  <IconInfo size="iconSmall" />
                  <Text variant="body2">
                    Please ensure you have access to this Ethereum address. Any incorrect address added will result in
                    lost tokens.
                  </Text>
                </Grid>
                <Button small style={{ width: '100%' }} onClick={() => setStep(1)} disabled={!isAddressValid}>
                  Migrate
                </Button>
              </>
            )}

            {step === 1 && (
              <Box>
                <Header />
                <Text variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
                  Review the details before migrating CFG tokens from Ethereum to Centrifuge.
                </Text>
                <ConfirmationDetails />
                <Grid display="flex" gap={1} mb={2} mt={2}>
                  <IconInfo size="iconSmall" />
                  <Text variant="body2">Please note that there will be a delay during the bridging process.</Text>
                </Grid>
                <Divider color="borderSecondary" />
                <Grid display="flex" gap={1} mb={2} mt={2}>
                  <Button
                    small
                    style={{ width: '100%' }}
                    onClick={() => setStep(0)}
                    variant="inverted"
                    disabled={isLoadingMigration}
                  >
                    Cancel
                  </Button>
                  <Button
                    small
                    style={{ width: '100%' }}
                    onClick={migrate}
                    loading={isLoadingMigration}
                    disabled={isLoadingMigration}
                  >
                    Confirm
                  </Button>
                </Grid>
              </Box>
            )}

            {step === 2 && (
              <Box>
                <Header />
                <Grid
                  backgroundColor={theme.colors.statusInfoBg}
                  borderRadius={8}
                  p={2}
                  mt={2}
                  display="flex"
                  flexDirection="column"
                  gap={2}
                >
                  <Grid display="flex" gap={1} alignItems="center">
                    <IconClock />
                    <Text variant="heading3">Migration inititated</Text>
                  </Grid>
                  <Text variant="body2">
                    [{evmAddress}] Your migration has been initiated{' '}
                    <b>
                      <a
                        href={axelarUrl}
                        style={{ color: theme.colors.textPrimary, textDecoration: 'underline' }}
                        target="_blank"
                      >
                        (click to view details)
                      </a>
                    </b>
                    . The bridge transaction is expected to complete in approximately: <b>20 mins</b>.
                  </Text>
                </Grid>

                <ConfirmationDetails />
              </Box>
            )}

            {step === 3 && (
              <MigrationSuccessPage
                title="CFG"
                currencyName="Legacy CFG"
                balance={initialTokenBalance || 0}
                address={evmAddress}
              />
            )}
          </Box>
        </Box>
      </Box>
    </ConnectionGuard>
  )
}
