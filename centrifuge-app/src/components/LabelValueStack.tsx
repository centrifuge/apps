import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'

type Props = {
  label: React.ReactNode
  value: React.ReactNode
  renderAs?: {
    label?: string
    value?: string
  }
}

export function LabelValueStack({ label, value, renderAs }: Props) {
  return (
    <Stack gap="4px">
      <Text as={renderAs?.label} variant="label2">
        {label}
      </Text>
      <Text as={renderAs?.value} variant="body2">
        {value}
      </Text>
    </Stack>
  )
}
