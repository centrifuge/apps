import { useWallet } from '@centrifuge/centrifuge-react'
import { Button, IconAlertCircle, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { usePodAuth } from '../utils/usePodAuth'

type Props = {
  message?: string
  buttonLabel?: string
  poolId: string
}

export const PodAuthSection: React.FC<Props> = ({
  message = 'This information is private',
  buttonLabel = 'Authenticate',
  poolId,
}) => {
  const { selectedAccount } = useWallet().substrate
  const { isAuthing, isAuthed, authError, login } = usePodAuth(poolId)

  return isAuthed ? null : (
    <Stack alignItems="center">
      <Shelf gap={2} justifyContent="center">
        <Shelf gap={1}>
          <IconAlertCircle size="iconSmall" /> <Text variant="body3">{message}</Text>
        </Shelf>
        {selectedAccount?.address && (
          <Button onClick={() => login()} small loading={isAuthing}>
            {buttonLabel}
          </Button>
        )}
      </Shelf>
      <>
        {authError && (
          <Text variant="body3" color="statusCritical">
            Failed to authenticate
          </Text>
        )}
      </>
    </Stack>
  )
}
