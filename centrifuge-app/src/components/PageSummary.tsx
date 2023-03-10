import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'

type Props = {
  data?: {
    label: React.ReactNode
    value: React.ReactNode
  }[]
  children?: React.ReactNode
}

export const PageSummary: React.FC<Props> = ({ data, children }) => {
  const theme = useTheme()
  return (
    <Shelf
      bg={theme.colors.backgroundSecondary}
      gap="6"
      pl={[2, 6]}
      py="3"
      style={{
        boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
      }}
    >
      {data?.map(({ label, value }, index) => (
        <Stack gap="4px" key={`${value}-${label}-${index}`}>
          <Text variant="body3">{label}</Text>
          <Text variant="heading3">{value}</Text>
        </Stack>
      ))}
      {children}
    </Shelf>
  )
}
