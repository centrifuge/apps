import { Card, Container, Text } from '@centrifuge/fabric'
import * as React from 'react'

export const CollectionsPage: React.FC = () => {
  return (
    <Container>
      <Card p={3}>
        <Text variant="heading1">Collections</Text>
      </Card>
    </Container>
  )
}
