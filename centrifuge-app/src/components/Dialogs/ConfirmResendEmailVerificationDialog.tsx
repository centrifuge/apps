import { Box, Button, Dialog, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useSendVerifyEmail } from '../../pages/Onboarding/queries/useSendVerifyEmail'

type Props = {
  isDialogOpen: boolean
  setIsDialogOpen: (isDialogOpen: boolean) => void
  currentEmail: string
}

export const ConfirmResendEmailVerificationDialog = ({ isDialogOpen, setIsDialogOpen, currentEmail }: Props) => {
  const { mutate: sendVerifyEmail, isLoading } = useSendVerifyEmail()

  return (
    <Dialog
      width="30%"
      isOpen={isLoading ? true : isDialogOpen}
      onClose={() => setIsDialogOpen(false)}
      title={<Text variant="heading2">Send Confirmation Email</Text>}
    >
      <Box>
        <Stack gap={3}>
          <Text variant="body1">Are you sure you want to resend a confirmation email to {currentEmail}?</Text>
          <Shelf gap={2} justifyContent="flex-end">
            <Button onClick={() => setIsDialogOpen(false)} variant="secondary" disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                sendVerifyEmail(undefined, {
                  onSuccess: () => {
                    setIsDialogOpen(false)
                  },
                })
              }
              loading={isLoading}
              disabled={isLoading}
              loadingMessage="Sending"
            >
              Send
            </Button>
          </Shelf>
        </Stack>
      </Box>
    </Dialog>
  )
}
