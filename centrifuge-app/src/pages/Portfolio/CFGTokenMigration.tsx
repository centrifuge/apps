import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { ConnectionGuard, useAddress } from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, Divider, Grid, IconInfo, Stack, Step, Stepper, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useTheme } from 'styled-components'
import { LayoutSection } from '../../../src/components/LayoutBase/LayoutSection'
import { useEvmTransaction } from '../../../src/utils/tinlake/useEvmTransaction'
import { Tooltips } from '../../components/Tooltips'
import { isTestEnv } from '../../config'
import { Dec, Decimal } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useCFGTokenPrice } from '../../utils/useCFGTokenPrice'
import MigrationSuccessPage from './MigrationSuccessPage'
import { MigrationSupportLink } from './MigrationSupportLink'
import { cfgConfig, useCheckAllowance, useTokenBalance } from './useTokenBalance'

export const TooltipText = () => {
  return (
    <Stack gap={2}>
      <Text variant="body4" color="white">
        - <b>1:1 conversion</b>: You will receive <b>1 CFG for every 1 WCFG/Legacy CFG migrated</b>.
      </Text>
      <Text variant="body4" color="white">
        - <b>Gas fees</b>: A small ETH gas fee is required to complete the migration.
      </Text>
      <Text variant="body4" color="white">
        - <b>Why migrate?</b>:The old Centrifuge chain will be <b>discontinued in Q4 2025</b>. Ensure your tokens are
        upgraded.
      </Text>
      <Text variant="body4" color="white">
        - <b>Snapshot date</b>: The total supply snapshot will be taken on <b>March 25, 2025</b>. For more details,
        visit the {''}
        <a
          href="https://docs.centrifuge.io"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'white', textDecoration: 'underline' }}
        >
          Centrifuge Docs
        </a>
        .
      </Text>
    </Stack>
  )
}

export default function CFGTokenMigration() {
  const theme = useTheme()
  const address = useAddress('evm')
  const { data: tokenBalances } = useTokenBalance(address)
  const balance = tokenBalances?.legacy?.balance
  const CFGPrice = useCFGTokenPrice()
  const wcfgValue = balance ? balance.mul(Dec(CFGPrice || 0)) : Dec(0)
  const [isMigrated, setIsMigrated] = useState<boolean>(false)
  const [step, setStep] = useState<number>(0)
  const [gasPrice, setGasPrice] = useState<string>('')

  const allowance = useCheckAllowance(address).data
  const isPendingAllowance = allowance && !allowance?.isZero()
  const isAllowanceSameAsBalance = allowance?.toNumber() === balance?.toNumber()

  useEffect(() => {
    async function getGasPrice() {
      const gas = await window.ethereum.request({
        method: 'eth_gasPrice',
      })
      setGasPrice(ethers.formatUnits(gas, 'gwei'))
    }
    getGasPrice()
  }, [])

  useEffect(() => {
    if (isPendingAllowance) {
      setStep(isAllowanceSameAsBalance ? 2 : 0)
    }
  }, [isPendingAllowance, isAllowanceSameAsBalance])

  const { execute: executeDeposit, isLoading: isDepositing } = useEvmTransaction(
    `Migrate WCFG for CFG`,
    (cent) =>
      ([, ...args]: [cb: () => void, amount: BN, wrapperAddress: string], options) =>
        cent.migration.depositForMigration(args, options),
    {
      onSuccess: () => {
        setIsMigrated(true)
      },
    }
  )

  const { execute: executeApprove, isLoading: isApproving } = useEvmTransaction(
    `Approve WCFG for Migration`,
    (cent) =>
      ([, ...args]: [cb: () => void, amount: BN, legacyAddress: string, wrapperAddress: string], options) =>
        cent.migration.approveForMigration(args, options),
    {
      onSuccess: ([cb]) => {
        const amount = CurrencyBalance.fromFloat(balance || 0, 18)
        setStep(2)
        executeDeposit([cb, amount, cfgConfig.iou])
      },
    }
  )

  const migrate = () => {
    if (isAllowanceSameAsBalance) {
      executeDeposit([() => {}, CurrencyBalance.fromFloat(balance || 0, 18), cfgConfig.iou])
    } else {
      setStep(1)
      executeApprove([() => {}, CurrencyBalance.fromFloat(balance || 0, 18), cfgConfig.legacy, cfgConfig.iou])
    }
  }

  return (
    <Box mb={2}>
      <LayoutSection alignItems="flex-start">
        <Text variant="heading1">Portfolio</Text>
      </LayoutSection>
      <Box
        backgroundColor="backgroundSecondary"
        border={`1px solid ${theme.colors.borderSecondary}`}
        borderRadius={8}
        height="80vh"
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
          width={500}
          style={{
            boxShadow: '4px 8px 24px 0px #0000000D',
          }}
        >
          {isMigrated ? (
            <MigrationSuccessPage
              title="WCFG"
              balance={balance?.toNumber() || 0}
              currencyName="WCFG"
              address={address ?? ''}
            />
          ) : (
            <>
              <Grid gridTemplateColumns="1fr 24px" alignItems="center" mb={2}>
                <Text variant="heading2">{`WCFG -> CFG Migration`}</Text>
                <Tooltips type="nav" placement="bottom" label={<IconInfo size="iconSmall" />} body={<TooltipText />} />
              </Grid>
              <Divider color="borderSecondary" />
              <Grid gridTemplateColumns="1fr 1fr 1fr" alignItems="center" mb={2} mt={2}>
                <Box>
                  <Text variant="body3" color="textSecondary">
                    Position
                  </Text>
                  <Text variant="heading3">{formatBalance(balance?.toNumber() || 0, '', 2)} WCFG</Text>
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
                    value={balance?.toNumber() || 0}
                    currency="WCFG"
                    label="Amount of WCFG to migrate"
                    disabled
                    secondaryValue="Max"
                  />
                  <Text style={{ marginTop: 8, alignSelf: 'flex-end' }} variant="body2">
                    Wallet balance: {formatBalance(balance?.toNumber() || 0)} WCFG
                  </Text>
                </Box>
                <CurrencyInput value={balance?.toNumber() || 0} currency="CFG" label="Amount of CFG tokens" disabled />
                <Grid display="flex" justifyContent="space-between" mt={2} mb={2}>
                  <Text variant="heading4">Amount of CFG tokens</Text>
                  <Text variant="body2" color="textSecondary">
                    {formatBalance(balance?.toNumber() || 0)} WCFG
                  </Text>
                </Grid>
                <Grid display="flex" justifyContent="space-between" mt={2} mb={2}>
                  <Text variant="heading4">Network cost</Text>
                  <Text variant="body2" color="textSecondary">
                    - {formatBalance(new Decimal(gasPrice || 0), '', 2)} Gwei
                  </Text>
                </Grid>
                <Divider color="borderSecondary" />
                <Grid display="flex" justifyContent="space-between" mt={2}>
                  <Text variant="heading3">Total amount of CFG tokens</Text>
                  <Text variant="heading3">{formatBalance(balance?.toNumber() || 0)} CFG</Text>
                </Grid>
              </Box>
              <ConnectionGuard
                networks={isTestEnv ? [11155111] : [1]}
                body="Please connect to the Ethereum to continue."
                showConnect
              >
                <Button
                  small
                  style={{ width: '100%' }}
                  onClick={migrate}
                  loading={isApproving || isDepositing}
                  disabled={balance?.isZero()}
                >
                  {isAllowanceSameAsBalance ? 'Migrate WCFG' : 'Approve WCFG and migrate'}
                </Button>
              </ConnectionGuard>
              <MigrationSupportLink />
              <Box mt={2} justifyContent="center" display="flex">
                <Stepper activeStep={step} setActiveStep={setStep} direction="row">
                  <Step label="Approve" isActive={step === 1} isStepCompleted={step === 2} empty variant="secondary" />
                  <Step
                    label="Confirm migration"
                    isActive={step === 2}
                    isStepCompleted={isMigrated}
                    empty
                    variant="secondary"
                  />
                </Stepper>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
