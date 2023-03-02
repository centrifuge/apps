import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'

type ContentHeaderProps = {
  title: React.ReactNode
  body?: React.ReactNode
}

const Body = styled(Text)`
  a {
    color: inherit;

    &:hover {
      text-decoration: underline;
    }

    &:focus-visible {
      outline: ${({ theme }) => `1px solid ${theme.colors.accentPrimary}`};
    }
  }
`

export function ContentHeader({ title, body }: ContentHeaderProps) {
  return (
    <Stack as="header" gap={2}>
      <Text as="h2" fontSize={36} lineHeight={1.25} fontWeight={500}>
        {title}
      </Text>

      {body && (
        <Body forwardedAs="p" variant="body1">
          {body}
        </Body>
      )}
    </Stack>
  )
}
