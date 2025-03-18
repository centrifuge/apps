import { ConnectionGuard, truncateAddress, useAddress } from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, Divider, Grid, IconArrowRight, IconInfo, Stack, Text } from '@centrifuge/fabric'
import { getAddress } from 'ethers'
import { useState } from 'react'
import { useTheme } from 'styled-components'
import { LayoutSection } from '../../../src/components/LayoutBase/LayoutSection'
import { Tooltips } from '../../components/Tooltips'
import { Dec, Decimal } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { useCFGTokenPrice } from '../../utils/useCFGTokenPrice'

const TooltipText = () => {
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
  const { data: balances } = useTinlakeBalances(address)
  const wcfg = balances?.currencies.find((balance) => balance.currency.symbol === 'wCFG')
  const wcfgBalance = wcfg?.balance || Dec(0)
  const formattedAddress = address ? getAddress(address) : ''
  const CFGPrice = useCFGTokenPrice()
  const convertedWcfgBalance =
    wcfgBalance instanceof Decimal ? wcfgBalance || Dec(0) : wcfgBalance.toDecimal() || Dec(0)
  const wcfgValue = convertedWcfgBalance.mul(Dec(CFGPrice || 0))

  const [amountToTransfer, setAmountToTransfer] = useState<number>(0)
  const [isMigrated, setIsMigrated] = useState<boolean>(false)

  const migrate = () => {
    console.log(amountToTransfer)
    setIsMigrated(true)
  }

  return (
    <ConnectionGuard networks={[1]}>
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
            width={550}
            style={{
              boxShadow: '4px 8px 24px 0px #0000000D',
            }}
          >
            {isMigrated ? (
              <Box>
                <Grid gridTemplateColumns="1fr 24px" alignItems="center" mb={2}>
                  <Text variant="heading2">WCFG - Migration Successful</Text>
                  <Tooltips
                    type="nav"
                    placement="bottom"
                    label={<IconInfo size="iconSmall" />}
                    body={<TooltipText />}
                  />
                </Grid>
                <Divider color="borderSecondary" />
                <Grid gridTemplateColumns="1fr 100px" alignItems="center" mb={2} mt={2}>
                  <Text variant="body2" color="textSecondary">
                    Ethereum wallet address
                  </Text>
                  <Text variant="body2" color="textSecondary">
                    {truncateAddress(formattedAddress)}
                  </Text>
                </Grid>
                <Box
                  backgroundColor={theme.colors.statusOkBg}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={3}
                  px={6}
                  borderRadius={8}
                >
                  <Box alignItems="center" display="flex" flexDirection="column">
                    <Text variant="heading1">{formatBalance(amountToTransfer, '', 2)}</Text>
                    <Text variant="body2">WCFG</Text>
                  </Box>
                  <Box
                    width="40px"
                    height="40px"
                    borderRadius="50%"
                    border={`1px solid ${theme.colors.textPrimary}`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <IconArrowRight size="iconMedium" />
                  </Box>

                  <Box alignItems="center" display="flex" flexDirection="column">
                    <Text variant="heading1">{formatBalance(amountToTransfer, '', 2)}</Text>
                    <Text variant="body2">CFG</Text>
                  </Box>
                </Box>
              </Box>
            ) : (
              <>
                <Grid gridTemplateColumns="1fr 24px" alignItems="center" mb={2}>
                  <Text variant="heading2">{`WCFG -> CFG Migration`}</Text>
                  <Tooltips
                    type="nav"
                    placement="bottom"
                    label={<IconInfo size="iconSmall" />}
                    body={<TooltipText />}
                  />
                </Grid>
                <Divider color="borderSecondary" />
                <Grid gridTemplateColumns="1fr 1fr 1fr" alignItems="center" mb={2} mt={2}>
                  <Box>
                    <Text variant="body3" color="textSecondary">
                      Position
                    </Text>
                    <Text variant="heading3">{formatBalance(wcfgBalance, '', 2)} WCFG</Text>
                  </Box>
                  <Box>
                    <Text variant="body3" color="textSecondary">
                      Value
                    </Text>
                    <Text variant="heading3">{formatBalance(wcfgValue, '', 2)} WCFG</Text>
                  </Box>
                  <Box>
                    <Text variant="body3" color="textSecondary">
                      CFG price
                    </Text>
                    <Text variant="heading3">{formatBalance(CFGPrice || 0, '', 2)} CFG</Text>
                  </Box>
                </Grid>
                <Box border={`1px solid ${theme.colors.borderSecondary}`} borderRadius={8} p={2} mb={3}>
                  <Box display="flex" flexDirection="column">
                    <CurrencyInput
                      value={amountToTransfer}
                      onChange={(e) => setAmountToTransfer(e === '' ? 0 : e)}
                      currency="WCFG"
                      label="Amount of WCFG to migrate"
                      max={convertedWcfgBalance.toString()}
                    />
                    <Text style={{ marginTop: 8, alignSelf: 'flex-end' }} variant="body2">
                      Wallet balance: {formatBalance(wcfgBalance)} WCFG
                    </Text>
                  </Box>
                  <CurrencyInput value={amountToTransfer} currency="CFG" label="Amount of CFG tokens" disabled />
                </Box>
                <Button
                  small
                  style={{ width: '100%' }}
                  disabled={amountToTransfer === 0 || wcfgBalance.isZero()}
                  onClick={migrate}
                >
                  Migrate
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </ConnectionGuard>
  )
}
