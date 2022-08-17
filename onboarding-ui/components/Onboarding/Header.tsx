import * as React from 'react'
import { Stack } from '../Layout'
import { Heading, Text } from '../Text'

interface Props {
  title?: string
  subtitle?: string
}

export const Header: React.FC<Props> = ({ title, subtitle }) => {
  return (
    <Stack alignItems="center" gap="xsmall">
      {title && <Heading fontSize={[16, 24]}>{title}</Heading>}
      {subtitle && (
        <Text fontSize={16} color="#2762ff" fontWeight={500}>
          {subtitle}
        </Text>
      )}
    </Stack>
  )
}
