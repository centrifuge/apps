import { Box, Flex, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '../../components/Spinner'
import { config } from '../../config'
import { useVerifyEmail } from './queries/useVerifyEmail'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_, WordMark] = config.logo

export const EmailVerified: React.FC = () => {
  const { error, data } = useVerifyEmail()

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
          <Text fontSize={5}>
            {data ? 'Thanks for verifying your email' : error ? 'An error occurred' : <Spinner />}
          </Text>
        </Stack>
      </Grid>
    </Flex>
  )
}
