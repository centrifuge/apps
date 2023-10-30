import * as React from 'react'
import styled from 'styled-components'
import { Box, BoxProps } from '../Box'
import { Collapsible, CollapsibleChevron } from '../Collapsible'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

export type AccordionProps = BoxProps & {
  items: { title: React.ReactNode; body: React.ReactNode }[]
}

const Root = styled(Box)`
  list-style: none;
`

const Toggle = styled(Shelf)`
  appearance: none;
  background-color: transparent;
  border: 0;
  outline: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.textSelected};

    > * {
      color: inherit;
    }
  }
`

export function Accordion({ items, ...boxProps }: AccordionProps) {
  return (
    <Root
      as="ul"
      pl={0}
      aria-label="Accordion Control Group Buttons"
      borderRadius="card"
      borderStyle="solid"
      borderWidth={1}
      borderColor="borderSecondary"
      role="list"
      {...boxProps}
    >
      {items.map((entry, index) => (
        <AccordionEntry {...entry} key={index} borderTopWidth={index > 0 ? 1 : 0} />
      ))}
    </Root>
  )
}

function AccordionEntry({ title, body, ...boxProps }: AccordionProps['items'][number] & BoxProps) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()

  return (
    <Box as="li" borderStyle="solid" borderWidth={0} borderColor="borderSecondary" {...boxProps}>
      <Toggle
        as="button"
        id={`accordion-control-${id}`}
        width="100%"
        p={2}
        justifyContent="space-between"
        alignItems="center"
        onClick={() => setOpen(!open)}
        aria-controls={`content-${id}`}
        aria-expanded={open}
      >
        <Text as="strong" variant="heading3">
          {title}
        </Text>
        <CollapsibleChevron open={open} />
      </Toggle>
      <Collapsible id={`content-${id}`} open={open}>
        <Box p={2} backgroundColor="backgroundSecondary">
          <Text variant="body2">{body}</Text>
        </Box>
      </Collapsible>
    </Box>
  )
}
