import { Box, Button, Dialog, Shelf, Stack, Text, TextInput } from '@centrifuge/fabric'
import * as React from 'react'
import { useMutation } from 'react-query'
import { string } from 'yup'
import { useAuth } from '../AuthProvider'
import { useOnboardingUser } from '../OnboardingUserProvider'

type Props = {
  isEditOnboardingEmailAddressDialogOpen: boolean
  setIsEditOnboardingEmailAddressDialogOpen: (isEditOnboardingEmailAddressDialogOpen: boolean) => void
  currentEmail: string
}

export const EditOnboardingEmailAddressDialog = ({
  isEditOnboardingEmailAddressDialogOpen,
  setIsEditOnboardingEmailAddressDialogOpen,
  currentEmail,
}: Props) => {
  const [newEmail, setNewEmail] = React.useState('')
  const { authToken } = useAuth()
  const { refetchOnboardingUser } = useOnboardingUser()

  const isValid = React.useMemo(() => string().email().required().isValidSync(newEmail), [newEmail])

  const { mutate: updateEmail, isLoading } = useMutation(
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/sendVerifyEmail`, {
        method: 'POST',
        body: JSON.stringify({
          email: newEmail,
        }),
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
        setIsEditOnboardingEmailAddressDialogOpen(false)
      },
    }
  )

  return (
    <Dialog
      width="30%"
      isOpen={isLoading ? true : isEditOnboardingEmailAddressDialogOpen}
      onClose={() => setIsEditOnboardingEmailAddressDialogOpen(false)}
      title={<Text variant="heading1">Edit Email Address</Text>}
    >
      <Box p={4}>
        <Stack gap={4}>
          <TextInput value={currentEmail} label="Current Email Address" disabled />
          <TextInput value={newEmail} label="New Email Address" onChange={(event) => setNewEmail(event.target.value)} />
          <Shelf justifyContent="flex-end" gap={2}>
            <Button
              onClick={() => setIsEditOnboardingEmailAddressDialogOpen(false)}
              variant="secondary"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateEmail()}
              loading={isLoading}
              disabled={isLoading || !isValid}
              loadingMessage="Updating"
            >
              Update
            </Button>
          </Shelf>
        </Stack>
      </Box>
    </Dialog>
  )
}
