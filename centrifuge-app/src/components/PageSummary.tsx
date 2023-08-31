import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'

type Props = {
  data?: {
    label: React.ReactNode
    value: React.ReactNode
  }[]
  children?: React.ReactNode
  title?: React.ReactNode
}

export const PageSummary: React.FC<Props> = ({ data, children, title }) => {
  const theme = useTheme()
  return (
    <Stack bg={theme.colors.backgroundSecondary} pl={3}>
      {title}
      <Shelf
        gap="6"
        py="3"
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
        }}
      >
        {data?.map(({ label, value }, index) => (
          <Stack gap="4px" key={`${value}-${label}-${index}`}>
            <Text variant="body3" style={{ fontWeight: 500 }}>
              {label}
            </Text>
            <Text variant="body2">{value}</Text>
          </Stack>
        ))}
        {children}
      </Shelf>
    </Stack>
  )
}
