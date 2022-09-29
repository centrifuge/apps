import { Button, IconAlertCircle, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { usePodAuth } from './PodAuthProvider'

type Props = {
  podUrl: string
  message?: string
  buttonLabel?: string
}

export const PodAuthSection: React.FC<Props> = ({
  podUrl,
  message = 'This information is private',
  buttonLabel = 'Authenticate',
}) => {
  const { isLoggedIn, isLoggingIn, canLogIn, loginError, login } = usePodAuth(podUrl)

  return isLoggedIn ? null : (
    <Stack alignItems="center">
      <Shelf gap={2} justifyContent="center">
        <Shelf gap={1}>
          <IconAlertCircle size="iconSmall" /> <Text variant="body3">{message}</Text>
        </Shelf>
        {canLogIn && (
          <Button onClick={login} small loading={isLoggingIn}>
            {buttonLabel}
          </Button>
        )}
      </Shelf>
      {loginError && (
        <Text variant="body3" color="statusCritical">
          Failed to authenticate
        </Text>
      )}
    </Stack>
  )
}
