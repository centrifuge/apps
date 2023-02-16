import { Box, Flex, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { useQuery } from 'react-query'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../components/AuthProvider'
import { Spinner } from '../../components/Spinner'
import { config } from '../../config'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_, WordMark] = config.logo

export const UpdateInvestorStatus: React.FC = () => {
  const { authToken } = useAuth()
  const { search } = useLocation()
  const token = new URLSearchParams(search).get('token')
  const status = new URLSearchParams(search).get('status')

  const { error, data } = useQuery(
    ['update investor status'],
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/updateInvestorStatus?token=${token}&status=${status}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
          credentials: 'include',
        }
      )

      if (response.status === 204) {
        return response
      }
      throw response.statusText
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  )

  return (
    <Flex backgroundColor="backgroundSecondary" minHeight="100vh" flexDirection="column" textAlign="center">
      <Shelf as="header" justifyContent="space-between" gap={2} p={3}>
        <Shelf alignItems="center" gap={3}>
          <Box as={Link} to="/" width={110}>
            <WordMark />
          </Box>
        </Shelf>
      </Shelf>
      <Grid
        columns={1}
        mx="150px"
        my={5}
        height="100%"
        borderRadius="18px"
        backgroundColor="backgroundPrimary"
        alignItems="flex-start"
        gridTemplateColumns="1fr"
      >
        <Stack
          paddingTop={10}
          paddingLeft={7}
          paddingRight={7}
          paddingBottom={6}
          justifyContent="space-between"
          minHeight="520px"
        >
          <Text fontSize={5}>{data ? `Investor was ${status}` : error ? 'An error occurred' : <Spinner />}</Text>
        </Stack>
      </Grid>
    </Flex>
  )
}
