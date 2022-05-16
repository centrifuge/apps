import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'

type Variant = 'primary' | 'secondary'

type Props = {
  variant?: Variant
  label: React.ReactNode
  value: React.ReactNode
}

export const LabelValueStack: React.FC<Props> = ({ variant = 'primary', label, value }) => {
  return (
    <Stack>
      <Text variant={variant === 'primary' ? 'label1' : 'label2'}>{label}</Text>
      <Text variant="body2" fontWeight={variant === 'primary' ? 600 : 400}>
        {value}
      </Text>
    </Stack>
  )
}
