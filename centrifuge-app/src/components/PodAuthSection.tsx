import { useWallet } from '@centrifuge/centrifuge-react'
import { Button, IconAlertCircle, Shelf, Stack, Text } from '@centrifuge/fabric'
import { usePodAuth } from '../utils/usePodAuth'

type Props = {
  message?: string
  buttonLabel?: string
  poolId: string
  allowPODReadAccess?: boolean
}

export function PodAuthSection({
  message = 'This information is private',
  buttonLabel = 'Authenticate',
  poolId,
  allowPODReadAccess = true,
}: Props) {
  const { selectedAccount } = useWallet().substrate
  const { isAuthing, isAuthed, authError, login } = usePodAuth(poolId, undefined, allowPODReadAccess)

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
