import { Button, IconAlertCircle, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { usePod } from '../utils/usePod'
import { useWeb3 } from './Web3Provider'

type Props = {
  podUrl: string
  message?: string
  buttonLabel?: string
}

const AUTHORIZED_POD_PROXY_TYPES = ['Any', 'PodAuth', 'NodeAdmin']

export const PodAuthSection: React.FC<Props> = ({
  podUrl,
  message = 'This information is private',
  buttonLabel = 'Authenticate',
}) => {
  const { selectedAccount } = useWeb3()
  const { isLoggedIn, isPodLoading, loginError, login } = usePod(podUrl)

  return isLoggedIn ? null : (
    <Stack alignItems="center">
      <Shelf gap={2} justifyContent="center">
        <Shelf gap={1}>
          <IconAlertCircle size="iconSmall" /> <Text variant="body3">{message}</Text>
        </Shelf>
        {selectedAccount?.address && (
          <Button onClick={() => login(AUTHORIZED_POD_PROXY_TYPES)} small loading={isPodLoading}>
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
