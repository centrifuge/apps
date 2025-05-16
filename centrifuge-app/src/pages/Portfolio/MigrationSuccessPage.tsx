import { truncateAddress } from '@centrifuge/centrifuge-react'
import { Box, Divider, Grid, IconArrowRight, IconInfo, Stack, Text } from '@centrifuge/fabric'
import { getAddress } from 'ethers'
import { useTheme } from 'styled-components'
import { Tooltips } from '../../components/Tooltips'
import { formatBalance } from '../../utils/formatting'

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

export default function MigrationSuccessPage({
  title,
  currencyName,
  balance,
  address,
}: {
  title: string
  currencyName: string
  balance: number
  address: string
}) {
  const theme = useTheme()
  const formattedAddress = address ? getAddress(address) : ''

  return (
    <Box>
      <Grid gridTemplateColumns="1fr 24px" alignItems="center" mb={2}>
        <Text variant="heading2">{title} - Migration Successful</Text>
        <Tooltips type="nav" placement="bottom" label={<IconInfo size="iconSmall" />} body={<TooltipText />} />
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
          <Text variant="heading1">{formatBalance(balance, '', 2)}</Text>
          <Text variant="body2">{currencyName}</Text>
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
          <Text variant="heading1">{formatBalance(balance, '', 2)}</Text>
          <Text variant="body2">CFG</Text>
        </Box>
      </Box>
    </Box>
  )
}
