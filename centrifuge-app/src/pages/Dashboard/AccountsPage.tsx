import { Box, IconInfo, Text } from '@centrifuge/fabric'
import OnchainSection from '../../../src/components/Dashboard/Account/OnchainSection'
import { useSelectedPools } from '../../../src/utils/contexts/SelectedPoolsContext'
import { PoolSelector } from '../../components/Dashboard/PoolSelector'

export default function AccountsPage() {
  const { selectedPools, pools = [] } = useSelectedPools()
  const pool = pools.find((pool) => pool.id === selectedPools[0])

  return (
    <Box py={2} px={3}>
      <Text variant="heading1">Dashboard</Text>
      <Box mt={5} mb={2}>
        <PoolSelector multiple={false} />
      </Box>
      {pool ? (
        <OnchainSection pool={pool} />
      ) : (
        <Box
          backgroundColor="backgroundSecondary"
          borderRadius={8}
          p={2}
          mt={3}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          border="1px solid"
          borderColor="borderPrimary"
          height="70vh"
        >
          <IconInfo size={28} />
          <Text variant="heading3">Select a pool to start</Text>
        </Box>
      )}
    </Box>
  )
}
