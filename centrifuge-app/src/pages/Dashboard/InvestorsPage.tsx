import { Box, Button, Checkbox, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useState } from 'react'
import { SupportedNetworksDrawer } from '../..//components/Dashboard/Investors/SupportedNetworksDrawer'
import { AddNewInvestorDrawer } from '../../components/Dashboard/Investors/AddNewInvestorDrawer'
import { InvestorTable } from '../../components/Dashboard/Investors/InvestorTable'
import { OnboardingSettingDrawer } from '../../components/Dashboard/Investors/OnboardingSettingDrawer'
import { useInvestorListMulti, usePools } from '../../utils/usePools'

export default function InvestorsPage() {
  const pools = usePools()?.slice(0, 3)
  const [selectedPools, setSelectedPools] = useState<string[]>(pools?.map((p) => p.id) ?? [])
  const [isAddNewInvestorDrawerOpen, setIsAddNewInvestorDrawerOpen] = useState(true)
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
      <OnboardingSettingDrawer
        isOpen={isOnboardingSettingsDrawerOpen}
        onClose={() => setIsOnboardingSettingsDrawerOpen(false)}
      />
      <Shelf gap={1}>
        {pools?.map((p) => (
          <Checkbox
            key={p.id}
            label={p.id}
            checked={selectedPools.includes(p.id)}
            onChange={() => {
              setSelectedPools((prev) => {
                if (prev.includes(p.id)) {
                  return prev.filter((id) => id !== p.id)
                }
                return [...prev, p.id]
              })
            }}
          />
        ))}
      </Shelf>
      <Shelf justifyContent="space-between">
        <Shelf gap={1}>
          <Box backgroundColor="backgroundTertiary" borderRadius={100} padding="2px 4px">
            <Text variant="body2" fontWeight="600">
              {investors?.length ?? 1 - 1}
            </Text>
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
