import * as React from 'react'
import { Stack } from '../Layout'
import { Heading, Text } from '../Text'

interface Props {
  title: string
  subtitle: string
}

export const Header: React.FC<Props> = ({ title, subtitle }) => {
  return (
    <Stack alignItems="center">
      <Heading fontSize={[16, 24]}>{title}</Heading>
      <Text fontSize={14} color="#2762ff" fontWeight={500}>
        {subtitle}
      </Text>
    </Stack>
  )
}
