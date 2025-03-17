import { ConnectionGuard, truncateAddress, useAddress } from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, Divider, Grid, IconArrowRight, IconInfo, Text } from '@centrifuge/fabric'
import { getAddress } from 'ethers'
import { useState } from 'react'
import { useTheme } from 'styled-components'
import { LayoutSection } from '../../../src/components/LayoutBase/LayoutSection'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { useCFGTokenPrice } from '../../utils/useCFGTokenPrice'

export default function CFGTokenMigration() {
  const theme = useTheme()
  const address = useAddress('evm')
  const { data: balances } = useTinlakeBalances(address)
  const wcfgBalance = balances?.currencies.find((balance) => balance.currency.symbol === 'wCFG')?.balance || Dec(0)
  const formattedAddress = address ? getAddress(address) : ''
  const CFGPrice = useCFGTokenPrice()

  const [amountToTransfer, setAmountToTransfer] = useState<number>(0)
  const [isMigrated, setIsMigrated] = useState<boolean>(false)

  console.log(CFGPrice)

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
                  <IconInfo size="iconSmall" />
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
                  <IconInfo size="iconSmall" />
                </Grid>
                <Divider color="borderSecondary" />
                <Grid gridTemplateColumns="1fr 1fr 1fr" alignItems="center" mb={2} maxWidth="50%" mt={2}>
                  <Box>
                    <Text variant="body3" color="textSecondary">
                      Position
                    </Text>
                    <Text variant="heading3">{formatBalance(wcfgBalance)} WCFG</Text>
                  </Box>
                </Grid>
                <Box border={`1px solid ${theme.colors.borderSecondary}`} borderRadius={8} p={2} mb={3}>
                  <Box display="flex" flexDirection="column">
                    <CurrencyInput
                      value={amountToTransfer}
                      onChange={(e) => setAmountToTransfer(e === '' ? 0 : e)}
                      currency="WCFG"
                      label="Amount of WCFG to migrate"
                    />
                    <Text style={{ marginTop: 8, alignSelf: 'flex-end' }} variant="body2">
                      Wallet balance: {formatBalance(wcfgBalance)} WCFG
                    </Text>
                  </Box>
                  <CurrencyInput value={amountToTransfer} currency="CFG" label="Amount of CFG tokens" disabled />
                </Box>
                <Button small style={{ width: '100%' }}>
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
