import { Button, Checkbox, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { ActionBar, Content, ContentHeader } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { OnboardingUser } from '../../types'
import { useVerifyAccreditation } from './queries/useVerifyAccreditation'

export const Accreditation = () => {
  const [isAccredited, setIsAccredited] = React.useState(false)
  const { onboardingUser, previousStep, nextStep } = useOnboarding<NonNullable<OnboardingUser>>()

  const isCompleted = !!onboardingUser.globalSteps.verifyAccreditation?.completed

  const { mutate: verifyAccreditation, isLoading } = useVerifyAccreditation()

  return (
    <>
      <Content>
        <ContentHeader
          title="Accredited investor assessment"
          body="Following is the criteria for being an accredited investor, as per the SEC publications:"
        />

        <Stack as="ul" gap={2} style={{ listStyle: 'disc' }}>
          <Text as="li" variant="body1">
            An annual income of $200,000 or greater ($300,000 in case of joint partners with a spouse) and proof of
            maintaining the same yearly
          </Text>
          <Text as="li" variant="body1">
            Net worth greater than $1 million either as a sole owner or with a joint partner, excluding residence
          </Text>
          <Text as="li" variant="body1">
            In the case of a trust, a total of $5 million in assets is required
          </Text>
          <Text as="li" variant="body1">
            An organization with all shareholders being accredited investors
          </Text>
        </Stack>

        <Checkbox
          checked={isCompleted || isAccredited}
          onChange={() => setIsAccredited((current) => !current)}
          label={
            <Text style={{ cursor: 'pointer', paddingLeft: '12px' }}>I confirm that I am an accredited investor</Text>
          }
          disabled={isCompleted || isLoading}
        />
      </Content>

      <ActionBar>
        <Button onClick={() => previousStep()} variant="secondary" disabled={isLoading}>
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
      </ActionBar>
    </>
  )
}
