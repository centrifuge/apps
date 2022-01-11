import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'

export const PoolFormPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <CreatePoolForm />
    </PageWithSideBar>
  )
}

const CreatePoolForm: React.FC = () => {
  return (
    <Stack>
      <Text variant="heading2" color="textSecondary">
        To be implemented
      </Text>
    </Stack>
  )
}
