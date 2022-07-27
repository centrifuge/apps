import { Box, Dialog, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { copyToClipboard } from '../../utils/copyToClipboard'

export const PreimageHashDialog: React.FC<{
  preimageHash: string
  metadataHash: string
  open: boolean
  onClose: () => void
}> = ({ preimageHash, metadataHash, open, onClose }) => {
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
          <Stack>
            <Text variant="heading2">Metadata hash</Text>
            <Box alignSelf="flex-end">
              <Text
                style={{
                  cursor: 'copy',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
                onClick={() => copyToClipboard(metadataHash)}
              >
                {metadataHash}
              </Text>
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Dialog>
  )
}
