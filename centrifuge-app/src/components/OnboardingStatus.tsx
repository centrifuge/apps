import {
  iconActionStyles,
  IconClockForward,
  IconExternalLink,
  IconShieldCheck,
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useVerificationStatus } from './OnboardingProvider'
import { RouterLinkButton } from './RouterLinkButton'

const ActionLink = styled(Link)`
  ${iconActionStyles}
`

export function OnboardingStatus() {
  const status = useVerificationStatus()

  return status ? (
    <Stack px={2} py={1} gap="4px">
      <Text as="span" variant="label2" color="textPrimary">
        Verification status:
      </Text>

      {status === 'unverified' ? (
        <RouterLinkButton to="/onboarding" small>
          Verify identity
        </RouterLinkButton>
      ) : (
        <Shelf as="span" gap={1}>
          {status === 'pending' ? <IconClockForward size="iconSmall" /> : <IconShieldCheck size="iconSmall" />}
          <Text as="span" variant="interactive1" style={{ flexGrow: 1 }}>
            {status === 'pending' ? 'In progress…' : 'Complete'}
          </Text>

          {!!(status === 'pending') && (
            <ActionLink to="/onboarding" aria-label="Go to onboarding">
              <IconExternalLink size="iconSmall" />
            </ActionLink>
          )}
        </Shelf>
      )}
    </Stack>
  ) : null
}
