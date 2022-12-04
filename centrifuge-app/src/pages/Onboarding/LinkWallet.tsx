import { Box, Button, IconCheck, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useMemo } from 'react'
import Cookies from 'universal-cookie'
import { useCentrifuge } from '../../components/CentrifugeProvider'
import { useWeb3 } from '../../components/Web3Provider'

type Props = {
  isAuth: boolean
  nextStep: () => void
  refetchAuth: () => void
}

const cookies = new Cookies()

export const LinkWallet = ({ nextStep, isAuth, refetchAuth }: Props) => {
  const { selectedWallet, selectedAccount, connect, proxy } = useWeb3()
  const cent = useCentrifuge()

  const handleLogin = async () => {
    try {
      if (selectedAccount?.address && selectedWallet?.signer) {
        const { address } = selectedAccount

        const { token } = await cent.auth.generateJw3t(
          address,
          // @ts-expect-error Signer type version mismatch
          selectedWallet.signer
        )

        cookies.set(proxy ? `centrifuge-auth-${address}-${proxy.delegator}` : `centrifuge-auth-${address}`, token, {
          httpOnly: true,
        })
        // update database with address
        refetchAuth()
      }
    } catch {}
  }

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
            onClick={() => handleLogin()}
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
