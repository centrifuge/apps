import { Drawer, Text } from '@centrifuge/fabric'

export function SupportedNetworksDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <Text>Supported Networks</Text>
    </Drawer>
  )
}
