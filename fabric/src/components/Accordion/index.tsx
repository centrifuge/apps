import * as React from 'react'
import styled from 'styled-components'
import { Box, BoxProps } from '../Box'
import { Collapsible, CollapsibleChevron } from '../Collapsible'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

export type AccordionProps = BoxProps & {
  items: { title: React.ReactNode; body: React.ReactNode; sublabel?: string }[]
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

export function Accordion({ items, sublabel, ...boxProps }: AccordionProps) {
  return (
    <Root as="ul" pl={0} aria-label="Accordion Control Group Buttons" role="list" {...boxProps}>
      {items.map((entry, index) => (
        <AccordionEntry {...entry} key={index} borderTopWidth={index > 0 ? 1 : 0} />
      ))}
    </Root>
  )
}

function AccordionEntry({ title, body, sublabel, ...boxProps }: AccordionProps['items'][number] & BoxProps) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()

  return (
    <Box as="li" borderStyle="solid" borderWidth={0} borderColor="borderPrimary" {...boxProps}>
      <Toggle
        as="button"
        type="button"
        id={`accordion-control-${id}`}
        width="100%"
        py={2}
        justifyContent="space-between"
        alignItems="center"
        onClick={() => setOpen(!open)}
        aria-controls={`content-${id}`}
        aria-expanded={open}
      >
        <Box>
          <Text as="strong" variant="heading3">
            {title}
          </Text>
          {sublabel && (
            <Text variant="body2" color="textSecondary">
              {sublabel}
            </Text>
          )}
        </Box>

        <CollapsibleChevron open={open} />
      </Toggle>
      <Collapsible id={`content-${id}`} open={open}>
        <Box>
          <Text variant="body2">{body}</Text>
        </Box>
      </Collapsible>
    </Box>
  )
}
