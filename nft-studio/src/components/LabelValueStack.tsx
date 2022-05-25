import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'

type Props = {
  label: React.ReactNode
  value: React.ReactNode
}

export const LabelValueStack: React.FC<Props> = ({ label, value }) => {
  return (
    <Stack gap="4px">
      <Text variant="label2">{label}</Text>
      <Text variant="body2">{value}</Text>
    </Stack>
  )
}
