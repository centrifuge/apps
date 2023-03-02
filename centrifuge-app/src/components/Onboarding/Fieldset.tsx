import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'

type FieldsetProps = {
  children: React.ReactNode
}

export function Fieldset({ children }: FieldsetProps) {
  return (
    <Stack as="fieldset" gap={2} maxWidth={490} minWidth={0} m={0} p={0} border={0}>
      {children}
    </Stack>
  )
}

type LegendProps = {
  children: React.ReactNode
}

export function Legend({ children }: LegendProps) {
  return (
    <Text as="legend" variant="interactive2">
      {children}
    </Text>
  )
}
