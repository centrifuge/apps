import { Box, Dialog, IconInfo, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { copyToClipboard } from '../../utils/copyToClipboard'

export const FaucetConfirmationDialog: React.FC<{
  hash: string
  open: boolean
  error?: string
  onClose: () => void
}> = ({ hash, open, onClose, error }) => {
  return (
    <Dialog isOpen={open} onClose={onClose} width="684px" icon={<IconInfo />} title="Faucet claim">
      <Box display="flex">
        <Stack gap={3}>
          <Stack gap={2}>
            <Text variant="body1">
              {hash ? 'Success. Please allow a couple of minutes for the tokens to reach your wallet' : error}
            </Text>
            {hash && !error && (
              <Box>
                <Text variant="body1">Transaction hash:</Text>
                <Text
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
