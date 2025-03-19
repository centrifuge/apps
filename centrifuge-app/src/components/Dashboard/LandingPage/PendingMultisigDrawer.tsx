import { Drawer, Stack } from '@centrifuge/fabric'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { PendingMultisigs } from '../../PendingMultisigs'

export function PendingMultisigDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { selectedPoolsWithMetadata } = useSelectedPools()

  return (
    <Drawer isOpen={open} onClose={onClose} title="Pending multisigs">
      <Stack gap={2}>
        {selectedPoolsWithMetadata.map((pool) => (
          <PendingMultisigs key={pool.id} pool={pool} />
        ))}
      </Stack>
    </Drawer>
  )
}
