import { Card, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { PageContainer } from '../components/PageContainer'

export const CollectionsPage: React.FC = () => {
  return (
    <PageContainer>
      <Card p={3}>
        <Text variant="heading1">Collections</Text>
      </Card>
    </PageContainer>
  )
}
