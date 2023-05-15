import {
  Box,
  iconActionStyles,
  IconClockForward,
  IconExternalLink,
  IconShieldCheck,
  Shelf,
  Spinner,
  Stack,
  Text,
} from '@centrifuge/fabric'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useGlobalOnboardingStatus } from '../pages/Onboarding/queries/useGlobalOnboardingStatus'
import { RouterLinkButton } from './RouterLinkButton'

const ActionLink = styled(Link)`
  ${iconActionStyles}
`

export function OnboardingStatus() {
  const { data: globalOnboardingStatus, isFetching: isFetchingGlobalOnboardingStatus } = useGlobalOnboardingStatus()

  return (
    <Stack px={2} py={1} gap="4px">
      <Text as="span" variant="label2" color="textPrimary">
        Verification status:
      </Text>

      {isFetchingGlobalOnboardingStatus ? (
        <Box display="flex" justifyContent="center" alignItems="center">
          <Spinner />
        </Box>
      ) : globalOnboardingStatus === 'unverified' ? (
        <RouterLinkButton to="/onboarding" small>
          Verify identity
        </RouterLinkButton>
      ) : (
        <Shelf as="span" gap={1}>
          {globalOnboardingStatus === 'pending' ? (
            <IconClockForward size="iconSmall" />
          ) : (
            <IconShieldCheck size="iconSmall" />
          )}
          <Text as="span" variant="interactive1" style={{ flexGrow: 1 }}>
            {globalOnboardingStatus === 'pending' ? 'In progress…' : 'Complete'}
          </Text>

          {!!(globalOnboardingStatus === 'pending') && (
            <ActionLink to="/onboarding" aria-label="Go to onboarding">
              <IconExternalLink size="iconSmall" />
            </ActionLink>
          )}
        </Shelf>
      )}
    </Stack>
  )
}
