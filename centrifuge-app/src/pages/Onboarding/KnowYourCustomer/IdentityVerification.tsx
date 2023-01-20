import { Box, Flex } from '@centrifuge/fabric'
import { useQuery } from 'react-query'
import { useAuth } from '../../../components/AuthProvider'
import { Spinner } from '../../../components/Spinner'

type Props = {
  verifyIdentity: () => void
}

export const IdentityVerification = ({ verifyIdentity }: Props) => {
  const { authToken } = useAuth()

  const { data: shuftiproCallbackURLData, isFetching: isShuftiproCallbackURLFetching } = useQuery(
    ['shuftipro-callback-url', authToken],
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getShuftiProCallbackURL`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      return response.json()
    }
  )

  return (
    <Box>
      {isShuftiproCallbackURLFetching ? (
        <Box
          mx="150px"
          my={5}
          height="300px"
          borderRadius="18px"
          backgroundColor="backgroundPrimary"
          alignItems="flex-start"
        >
          <Flex height="100%" alignItems="center" justifyContent="center">
            <Spinner />
          </Flex>
        </Box>
      ) : (
        <iframe
          dataset-removable="true"
          name="shuftipro-iframe"
          id="shuftipro-iframe"
          src={shuftiproCallbackURLData}
          title="shufti-pro-identity-verification"
          allow="camera"
          width="100%"
          height="100%"
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            bottom: '0',
            right: '0',
            margin: '0',
            padding: '0',
            overflow: 'hidden',
            border: 'none',
            zIndex: '2147483647',
          }}
        />
      )}
    </Box>
  )
}
