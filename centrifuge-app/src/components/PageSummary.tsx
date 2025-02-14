import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'

type Props = {
  data?: {
    label: React.ReactNode
    value: React.ReactNode
    heading?: boolean
  }[]
  children?: React.ReactNode
}

export function PageSummary({ data, children, ...props }: Props) {
  const theme = useTheme()
  return (
    <Shelf
      bg={theme.colors.backgroundSecondary}
      gap={4}
      margin={3}
      padding={2}
      border={`1px solid ${theme.colors.borderSecondary}`}
      borderRadius={10}
      justifyContent="space-between"
      flexWrap="wrap"
      {...props}
    >
      {data?.map(({ label, value, heading }, index) => (
        <Stack gap="4px" key={`${value}-${label}-${index}`}>
          <Text variant="body3">{label}</Text>
          <Text as="h2" variant={heading ? 'heading' : 'heading2'}>
            {value}
          </Text>
        </Stack>
      ))}
      <Box marginLeft="auto">{children}</Box>
    </Shelf>
  )
}
