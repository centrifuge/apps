import { Box, IconInfo, Text } from '@centrifuge/fabric'
import { useEffect } from 'react'
import AssetsSection from '../../../src/components/Dashboard/Account/AssetsSection'
import OnchainSection from '../../../src/components/Dashboard/Account/OnchainSection'
import { useSelectedPools } from '../../../src/utils/contexts/SelectedPoolsContext'
import { PoolSelector } from '../../components/Dashboard/PoolSelector'

export default function AccountsPage() {
  const { selectedPoolsWithMetadata, selectedPoolIds, setSelectedPoolIds } = useSelectedPools()
  const pool = selectedPoolsWithMetadata.find((pool) => selectedPoolIds.includes(pool.id))

  useEffect(() => {
    setSelectedPoolIds([])
  }, [])

  return (
    <Box py={2} px={3}>
      <Text variant="heading1">Dashboard</Text>
      <Box mt={5} mb={2}>
        <PoolSelector multiple={false} />
      </Box>
      {pool ? (
        <>
          <OnchainSection pool={pool} />
          <AssetsSection pool={pool} />
        </>
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
