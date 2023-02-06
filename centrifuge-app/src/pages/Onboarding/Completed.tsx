import { AnchorButton, Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useQuery } from 'react-query'
import { useHistory } from 'react-router-dom'
import { useAuth } from '../../components/AuthProvider'

// TODO: use real pool title
const examplePool = {
  title: 'New Silver Junior Token',
}

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

export const Completed = () => {
  const { authToken } = useAuth()
  let history = useHistory()

  const { data: signedAgreementData } = useQuery(
    'subscription agreement',
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getSignedAgreement?poolId=${poolId}&trancheId=${trancheId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      )

      const json = await response.json()

      const documentBlob = new Blob([Uint8Array.from(json.signedAgreement.data).buffer], {
        type: 'application/pdf',
      })

      return URL.createObjectURL(documentBlob)
    },
    {
      refetchOnWindowFocus: false,
    }
  )

  return (
    <Stack gap={8}>
      <Box>
        <Text fontSize={5}>Onboarding complete!</Text>
        <Text>You have succesfully completed the onboarding for {examplePool.title}</Text>
      </Box>
      <Shelf gap="2">
        <AnchorButton variant="secondary" href={signedAgreementData} target="__blank">
          View subscription agreement
        </AnchorButton>
        <Button onClick={() => history.push('/')}>Invest</Button>
      </Shelf>
    </Stack>
  )
}
