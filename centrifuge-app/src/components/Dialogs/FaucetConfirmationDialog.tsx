import { Box, Dialog, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { copyToClipboard } from '../../utils/copyToClipboard'

export const FaucetConfirmationDialog: React.FC<{
  hash: string
  open: boolean
  error?: string
  onClose: () => void
}> = ({ hash, open, onClose, error }) => {
  return (
    <Dialog isOpen={open} onClose={onClose} width="684px" title="Claim submitted">
      <Box display="flex">
        <Stack gap={3}>
          <Stack gap={2}>
            <Text variant="body1" as="h2">
              {hash
                ? 'The transfer has been submitted. Please allow a couple of minutes for the transaction to complete.'
                : error}
            </Text>
            {hash && !error && (
              <Box>
                <Text as="p" variant="body1">
                  Hash:
                </Text>
                <Text
                  as="p"
                  role="button"
                  style={{
                    cursor: 'copy',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                  }}
                  variant="body1"
                  onClick={() => copyToClipboard(hash)}
                >
                  {hash}
                </Text>
              </Box>
            )}
          </Stack>
        </Stack>
      </Box>
    </Dialog>
  )
}
