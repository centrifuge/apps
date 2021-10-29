import { Box, Card, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'

type Props = {}

export const CollectionCard: React.FC<Props> = () => {
  return (
    <Card as={Link} to="/collection/1" variant="interactive" p={3}>
      <Shelf gap={3} justifyContent="space-between" alignItems="flex-start">
        <Stack gap={3}>
          <div>
            <Text as="h2" variant="heading2">
              Collection
            </Text>
            <Text variant="label1">By Some Person</Text>
          </div>
          <Text>
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Temporibus molestias autem, vitae totam
            voluptatum?
          </Text>
        </Stack>
        <Grid columns={2} gap={1}>
          <Box bg="#eee" width="80px" height="80px" />
          <Box bg="#eee" width="80px" height="80px" />
          <Box bg="#eee" width="80px" height="80px" />
          <Box bg="#eee" width="80px" height="80px" />
        </Grid>
      </Shelf>
    </Card>
  )
}
