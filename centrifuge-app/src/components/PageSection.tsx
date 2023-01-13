import { Box, Collapsible, CollapsibleChevron, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'

type Props = {
  title?: string
  titleAddition?: React.ReactNode
  subtitle?: string
  headerRight?: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
}

const Chevron = styled(CollapsibleChevron)`
  position: relative;
  top: -0.1em;
  align-self: center;
`

const CollapseButton = styled(Shelf)`
  background-color: transparent;
  outline: none;
  border: none;
  font-size: inherit;
  font-family: inherit;
  font-weight: inherit;
  cursor: pointer;

  &:focus-visible {
    color: ${({ theme }) => theme.colors.accentPrimary};
  }
`

export const PageSection: React.FC<Props> = ({
  title,
  titleAddition,
  subtitle,
  headerRight,
  collapsible,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = React.useState(defaultOpen)
  const theme = useTheme()
  console.log(theme)

  return (
    <Stack
      as="section"
      pl={3}
      pr={[3, 3, 7]}
      pt={3}
      pb={4}
      gap={3}
      borderTopWidth={1}
      borderTopStyle="solid"
      borderTopColor="borderSecondary"
    >
      {(title || titleAddition) && (
        <Shelf justifyContent="space-between" as="header">
          <Stack>
            <Shelf pl={!title ? [0, 0, 4] : undefined} gap={1} alignItems="baseline">
              {collapsible ? (
                <Text variant="heading2" as="h2">
                  <CollapseButton as="button" gap={2} alignItems="baseline" onClick={() => setOpen(!open)}>
                    <Chevron open={open} />
                    {title && <>{title}</>}
                  </CollapseButton>
                </Text>
              ) : (
                title && (
                  <Text variant="heading2" as="h2">
                    {title}
                  </Text>
                )
              )}

              <Text variant="body2" color="textSecondary">
                {titleAddition}
              </Text>
            </Shelf>

            {subtitle && (
              <Text variant="body2" color="textSecondary">
                {subtitle}
              </Text>
            )}
          </Stack>
          {headerRight}
        </Shelf>
      )}
      <Box pl={[0, 0, 4]}>{collapsible ? <Collapsible open={open}>{children}</Collapsible> : children}</Box>
    </Stack>
  )
}
