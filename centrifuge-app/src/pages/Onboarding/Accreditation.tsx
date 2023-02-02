import { Box, Button, Checkbox, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useMutation } from 'react-query'
import { useAuth } from '../../components/AuthProvider'
import { useOnboardingUser } from '../../components/OnboardingUserProvider'

type Props = {
  nextStep: () => void
  backStep: () => void
}

export const Accreditation = ({ backStep, nextStep }: Props) => {
  const [isAccredited, setIsAccredited] = React.useState(false)
  const { refetchOnboardingUser, onboardingUser } = useOnboardingUser()
  const { authToken } = useAuth()

  const isCompleted = !!onboardingUser?.steps?.verifyAccreditation?.completed

  const { mutate: verifyAccreditation, isLoading } = useMutation(
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/verifyAccreditation`, {
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

      const json = await response.json()

      if (!json.steps?.verifyAccreditation?.completed) {
        throw new Error()
      }
    },
    {
      onSuccess: () => {
        refetchOnboardingUser()
        nextStep()
      },
    }
  )

  return (
    <Stack gap={4}>
      <Box>
        <Text fontSize={5}>Accredited investor assesment</Text>
        <Stack gap={3}>
          <Text fontSize={2}>
            Following is the criteria for being an accredited investor, as per the SEC publications:
          </Text>
          <Text>
            <ul style={{ listStyle: 'disc' }}>
              <Stack gap={2}>
                <li>
                  An annual income of $200,000 or greater ($300,000 in case of joint partners with a spouse) and proof
                  of maintaining the same yearly
                </li>
                <li>
                  Net worth greater than $1 million either as a sole owner or with a joint partner, excluding residence{' '}
                </li>
                <li>In the case of a trust, a total of $5 million in assets is required</li>
                <li>An organization with all shareholders being accredited investors</li>
              </Stack>
            </ul>
          </Text>
        </Stack>
      </Box>
      <Checkbox
        style={{
          cursor: 'pointer',
        }}
        checked={isCompleted || isAccredited}
        onChange={() => setIsAccredited((current) => !current)}
        label={<Text style={{ cursor: 'pointer' }}>I confirm that I am an accredited investor</Text>}
        disabled={isCompleted || isLoading}
      />
      <Shelf gap="2">
        <Button onClick={() => backStep()} variant="secondary" disabled={isLoading}>
          Back
        </Button>
        <Button
          onClick={() => {
            isCompleted ? nextStep() : verifyAccreditation()
          }}
          disabled={isCompleted ? false : isLoading || !isAccredited}
          loading={isLoading}
          loadingMessage="Verifying"
        >
          Next
        </Button>
      </Shelf>
    </Stack>
  )
}
