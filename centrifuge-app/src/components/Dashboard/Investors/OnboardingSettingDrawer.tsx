import { Drawer, Text } from '@centrifuge/fabric'

export function OnboardingSettingDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <Text>Onboarding Settings</Text>
    </Drawer>
  )
}
