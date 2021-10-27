import { Card, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { PageContainer } from '../components/PageContainer'

export const CollectionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <PageContainer>
      <Card p={3}>
        <Text variant="heading1">Collection {id}</Text>
      </Card>
    </PageContainer>
  )
}
