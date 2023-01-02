import { Box, Button, IconCheck, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useMemo } from 'react'
import { useAuth } from '../../components/AuthProvider'
import { useWeb3 } from '../../components/Web3Provider'

type Props = {
  nextStep: () => void
  refetchAuth: () => void
}

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export const LinkWallet = ({ nextStep }: Props) => {
  const { selectedAccount, connect } = useWeb3()
  const { login, isAuth } = useAuth()

  const linkButtonText = useMemo(() => {
    if (isAuth) {
      return (
        <Shelf gap={1}>
          <Text variant="heading2" color="textButtonSecondaryDisabled">
            Linked
          </Text>
          <IconCheck />
        </Shelf>
      )
    }

    return <Text variant="heading2">Link wallet</Text>
  }, [isAuth])

  const connectButtonText = useMemo(() => {
    if (selectedAccount) {
      return (
        <Shelf gap={1}>
          <Text variant="heading2" color="textButtonSecondaryDisabled">
            Connected
          </Text>
          <IconCheck />
        </Shelf>
      )
    }

    return <Text variant="heading2">Connect wallet</Text>
  }, [selectedAccount])

  return (
    <Stack gap={4}>
      <Stack alignItems="flex-start" gap={10}>
        <Text fontSize={5}>Connect and link your wallet</Text>
        <Shelf gap={4}>
          <button
            onClick={() => connect()}
            disabled={!!selectedAccount}
            style={{
              background: 'none',
              border: '1px solid #e0e0e0',
              borderRadius: '11px',
              width: '200px',
              height: '200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: !!selectedAccount ? 'not-allowed' : 'pointer',
              backgroundColor: !!selectedAccount ? '#e0e0e0' : 'white',
            }}
          >
            {connectButtonText}
          </button>
          <button
            onClick={() => login(AUTHORIZED_ONBOARDING_PROXY_TYPES)}
            disabled={!!isAuth}
            style={{
              background: 'none',
              border: '1px solid #e0e0e0',
              borderRadius: '11px',
              width: '200px',
              height: '200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: !!isAuth ? 'not-allowed' : 'pointer',
              backgroundColor: !!isAuth ? '#e0e0e0' : 'white',
            }}
          >
            {linkButtonText}
          </button>
        </Shelf>
      </Stack>
      <Box>
        <Button variant="primary" onClick={() => nextStep()} disabled={!isAuth || !selectedAccount}>
          Next
        </Button>
      </Box>
    </Stack>
  )
}
