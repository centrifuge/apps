import { Box, Button, Dialog, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useSendVerifyEmail } from '../../pages/Onboarding/queries/useSendVerifyEmail'

type Props = {
  isDialogOpen: boolean
  setIsDialogOpen: (isDialogOpen: boolean) => void
}

export const ConfirmResendEmailVerificationDialog = ({ isDialogOpen, setIsDialogOpen }: Props) => {
  const { mutate: sendVerifyEmail, isLoading } = useSendVerifyEmail()

  return (
    <Dialog
      width="25%"
      isOpen={isLoading ? true : isDialogOpen}
      onClose={() => setIsDialogOpen(false)}
      title={<Text variant="heading1">Send Confirmation Email</Text>}
    >
      <Box p={2}>
        <Stack gap={4}>
          <Text variant="body1">Are you sure you want to resend a confirmation email?</Text>
          <Shelf justifyContent="flex-end" gap={2}>
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
