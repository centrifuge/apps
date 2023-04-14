import { AnchorButton, IconClockForward, IconShieldCheck, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useVerificationStatus } from './OnboardingProvider'

export function OnboardingStatus() {
  const status = useVerificationStatus()

  return status ? (
    <Stack px={2} py={1} gap="4px">
      <Text variant="label2" color="textPrimary">
        Verification status:
      </Text>

      {status === 'unverified' ? (
        <AnchorButton href="/onboarding" small>
          Verify identity
        </AnchorButton>
      ) : (
        <Shelf gap={1}>
          {status === 'pending' ? <IconClockForward size="iconSmall" /> : <IconShieldCheck size="iconSmall" />}
          <Text variant="interactive1">{status === 'pending' ? 'In progress…' : 'Complete'}</Text>
        </Shelf>
      )}
    </Stack>
  ) : null
}
