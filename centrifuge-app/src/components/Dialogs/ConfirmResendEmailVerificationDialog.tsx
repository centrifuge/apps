import { Box, Button, Dialog, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useMutation } from 'react-query'
import { useAuth } from '../AuthProvider'
import { useOnboarding } from '../OnboardingProvider'

type Props = {
  isDialogOpen: boolean
  setIsDialogOpen: (isDialogOpen: boolean) => void
}

export const ConfirmResendEmailVerificationDialog = ({ isDialogOpen, setIsDialogOpen }: Props) => {
  const { authToken } = useAuth()
  const { refetchOnboardingUser } = useOnboarding()

  const { mutate: sendVerifyEmail, isLoading } = useMutation(
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/sendVerifyEmail`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.status !== 200) {
        throw new Error()
      }
    },
    {
      onSuccess: () => {
        refetchOnboardingUser()
        setIsDialogOpen(false)
      },
    }
  )

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
            <Button onClick={() => sendVerifyEmail()} loading={isLoading} disabled={isLoading} loadingMessage="Sending">
              Send
            </Button>
          </Shelf>
        </Stack>
      </Box>
    </Dialog>
  )
}
