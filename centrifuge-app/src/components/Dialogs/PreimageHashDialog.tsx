import { Box, Dialog, Stack, Text } from '@centrifuge/fabric'
import { copyToClipboard } from '../../utils/copyToClipboard'

export function PreimageHashDialog({
  preimageHash,
  open,
  onClose,
}: {
  preimageHash: string
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog isOpen={open} onClose={onClose} width="684px">
      <Box display="flex">
        <Stack gap={3}>
          <Stack>
            <Text variant="heading2">Preimage hash</Text>
            <Box alignSelf="flex-end">
              <Text
                style={{
                  cursor: 'copy',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
                onClick={() => copyToClipboard(preimageHash)}
              >
                {preimageHash}
              </Text>
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Dialog>
  )
}
