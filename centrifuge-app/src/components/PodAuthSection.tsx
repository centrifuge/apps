import { useWallet } from '@centrifuge/centrifuge-react'
import { Button, IconAlertCircle, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { usePod } from '../utils/usePod'

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
  const { selectedAccount } = useWallet()
  const { isLoggedIn, isPodLoading, loginError, login } = usePod(podUrl)

  return isLoggedIn ? null : (
    <Stack alignItems="center">
      <Shelf gap={2} justifyContent="center">
        <Shelf gap={1}>
          <IconAlertCircle size="iconSmall" /> <Text variant="body3">{message}</Text>
        </Shelf>
        {selectedAccount?.address && (
          <Button onClick={() => login()} small loading={isPodLoading}>
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
