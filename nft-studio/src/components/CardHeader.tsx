import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'

type Props = {
  title: string
  titleAddition?: React.ReactNode
  subtitle?: string
  subtitleAddition?: React.ReactNode
  pretitle?: string
}

export const CardHeader: React.FC<Props> = ({ title, titleAddition, subtitle, subtitleAddition, pretitle }) => {
  return (
    <Stack as="header" justifyContent="space-between">
      {pretitle && (
        <Text variant="interactive1" color="accentPrimary">
          {pretitle}
        </Text>
      )}
      <Shelf justifyContent="space-between" alignItems="baseline">
        <Text variant="heading3" as="h3">
          {title}
        </Text>
        <Text variant="heading3">{titleAddition}</Text>
      </Shelf>
      {subtitle && (
        <Shelf justifyContent="space-between" alignItems="baseline">
          <Text variant="label1">{subtitle}</Text>
          <Text variant="label1">{subtitleAddition}</Text>
        </Shelf>
      )}
    </Stack>
  )
}
