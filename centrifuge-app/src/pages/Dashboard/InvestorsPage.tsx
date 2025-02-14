import { Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useState } from 'react'
import { useTheme } from 'styled-components'
import { SupportedNetworksDrawer } from '../..//components/Dashboard/Investors/SupportedNetworksDrawer'
import { AddNewInvestorDrawer } from '../../components/Dashboard/Investors/AddNewInvestorDrawer'
import { InvestorTable } from '../../components/Dashboard/Investors/InvestorTable'
import { OnboardingSettingsDrawer } from '../../components/Dashboard/Investors/OnboardingSettingsDrawer'
import { PoolSelector } from '../../components/Dashboard/PoolSelector'
import { useSelectedPools } from '../../utils/contexts/SelectedPoolsContext'
import { useInvestorListMulti } from '../../utils/usePools'

export default function InvestorsPage() {
  const theme = useTheme()
  const { pools, selectedPools } = useSelectedPools(true)
  const [isAddNewInvestorDrawerOpen, setIsAddNewInvestorDrawerOpen] = useState(false)
  const [isSupportedNetworksDrawerOpen, setIsSupportedNetworksDrawerOpen] = useState(false)
  const [isOnboardingSettingsDrawerOpen, setIsOnboardingSettingsDrawerOpen] = useState(false)
  const investors = useInvestorListMulti(selectedPools)

  return (
    <Stack gap={4} py={3} px={3}>
      <AddNewInvestorDrawer isOpen={isAddNewInvestorDrawerOpen} onClose={() => setIsAddNewInvestorDrawerOpen(false)} />
      <SupportedNetworksDrawer
        isOpen={isSupportedNetworksDrawerOpen}
        onClose={() => setIsSupportedNetworksDrawerOpen(false)}
      />
      <OnboardingSettingsDrawer
        isOpen={isOnboardingSettingsDrawerOpen}
        onClose={() => setIsOnboardingSettingsDrawerOpen(false)}
      />
      <Text variant="heading1">Dashboard</Text>
      <PoolSelector />
      <Shelf justifyContent="space-between">
        <Shelf gap={1}>
          <Box
            background={theme.colors.backgroundTertiary}
            borderRadius="50%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            width="28px"
            height="28px"
            style={{ fontWeight: 500, fontSize: 12 }}
          >
            {investors?.length ?? 1 - 1}
          </Box>
          <Text variant="body2" fontWeight="700">
            Investors
          </Text>
        </Shelf>
        <Shelf gap={1}>
          <Button variant="inverted" small onClick={() => setIsSupportedNetworksDrawerOpen(true)}>
            Supported networks
          </Button>
          <Button variant="inverted" small onClick={() => setIsOnboardingSettingsDrawerOpen(true)}>
            Onboarding settings
          </Button>
          <Button variant="secondary" small onClick={() => setIsAddNewInvestorDrawerOpen(true)}>
            Add new investor
          </Button>
        </Shelf>
      </Shelf>
      <InvestorTable pools={pools?.filter((p) => selectedPools.includes(p.id))} />
    </Stack>
  )
}
