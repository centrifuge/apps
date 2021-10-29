import { Box, Button, Container, Stack } from '@centrifuge/fabric'
import * as React from 'react'

const callCreateMetadata = async () => {
  const resp = await fetch(`.netlify/functions/createMetadata`).then((r) => r.json())
  console.log(resp)
}

export const SampleCreateMetadata: React.FC = ({ children }) => {
  return (
    <Box px={[2, 3]} bg="backgroundPage">
      <Container pt={5}>
        <Stack>
          <Button onClick={callCreateMetadata}>Create metadata</Button>
        </Stack>
      </Container>
    </Box>
  )
}
