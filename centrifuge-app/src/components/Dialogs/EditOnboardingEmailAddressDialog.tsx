import { Button, Dialog, Shelf, Stack, Text, TextInput } from '@centrifuge/fabric'
import * as React from 'react'
import { useMutation } from 'react-query'
import { string } from 'yup'
import { useOnboardingAuth } from '../OnboardingAuthProvider'
import { useOnboarding } from '../OnboardingProvider'

type Props = {
  isDialogOpen: boolean
  setIsDialogOpen: (isDialogOpen: boolean) => void
  currentEmail: string
}

export const EditOnboardingEmailAddressDialog = ({ isDialogOpen, setIsDialogOpen, currentEmail }: Props) => {
  const [newEmail, setNewEmail] = React.useState('')
  const { authToken } = useOnboardingAuth()
  const { refetchOnboardingUser } = useOnboarding()

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
        setIsDialogOpen(false)
      },
    }
  )

  return (
    <Dialog
      width="30%"
      isOpen={isLoading ? true : isDialogOpen}
      onClose={() => setIsDialogOpen(false)}
      title={<Text variant="heading2">Edit Email Address</Text>}
    >
      <Stack gap={3}>
        <TextInput value={currentEmail} label="Current Email Address" disabled />
        <TextInput value={newEmail} label="New Email Address" onChange={(event) => setNewEmail(event.target.value)} />
        <Shelf justifyContent="flex-end" gap={2}>
          <Button onClick={() => setIsDialogOpen(false)} variant="secondary" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => updateEmail()}
            loading={isLoading}
            disabled={isLoading || !isValid || newEmail === currentEmail}
            loadingMessage="Updating"
          >
            Update
          </Button>
        </Shelf>
      </Stack>
    </Dialog>
  )
}
