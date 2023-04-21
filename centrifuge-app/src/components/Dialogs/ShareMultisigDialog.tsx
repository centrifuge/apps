import { Multisig } from '@centrifuge/centrifuge-js'
import { Button, Dialog, IconCopy, IconSend, Shelf, Stack, Text, TextInput } from '@centrifuge/fabric'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { ButtonGroup } from '../ButtonGroup'

export type ShareMultisigDialogProps = {
  multisig: Multisig
  hash: string
  callData?: string
  open: boolean
  onClose: () => void
}

export function ShareMultisigDialog({ multisig, hash, callData, open, onClose }: ShareMultisigDialogProps) {
  const params = new URLSearchParams({
    hash,
    signers: multisig.signers.join(','),
    threshold: multisig.threshold.toString(),
    data: callData || '',
  })
  const url = new URL(`/multisig-approval`, window.location.origin)
  url.search = params as any
  const shareUrl = url.toString()

  const shareData: ShareData = {
    title: 'Approve Transaction',
    text: 'Approve a multisig transaction on the Centrifuge App',
    url: shareUrl,
  }

  return (
    <Dialog isOpen={open} onClose={onClose} title="Share link with other multisig signers">
      <Stack gap={2}>
        <Text variant="body2">Share the link below with the other multisig signers to finalize the transaction</Text>
        <Shelf gap={1}>
          <TextInput
            style={{
              cursor: 'copy',
            }}
            onClick={(e: any) => {
              copyToClipboard(shareUrl)
              e.target.select()
            }}
            value={shareUrl}
            readOnly
          />
          <ButtonGroup>
            <Button variant="tertiary" icon={IconCopy} onClick={() => copyToClipboard(shareUrl)} />
            {navigator.share && (
              <Button variant="tertiary" icon={IconSend} onClick={() => navigator.share(shareData)} />
            )}
          </ButtonGroup>
        </Shelf>
      </Stack>
    </Dialog>
  )
}
