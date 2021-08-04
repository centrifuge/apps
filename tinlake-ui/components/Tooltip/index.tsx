import { Tooltip as AxisTooltip } from '@centrifuge/axis-tooltip'
import * as React from 'react'
import styled from 'styled-components'
import tooltips from '../../static/tooltips.json'

interface BaseProps {
  children: React.ReactNode
  underline?: boolean
}

interface PropsWithID extends BaseProps {
  id: keyof typeof tooltips
}

interface PropsWithoutID extends BaseProps {
  title: string
  link?: string
  description?: string
}

interface Tooltip {
  title: string
  link?: string
  description?: string
}

type Props = PropsWithID | PropsWithoutID

const Wrapper = styled.span<{ underline?: boolean }>`
  [data-tip] > *,
  [data-tip] {
    border-bottom: ${(props) => (props.underline ? '1px dotted #bbbbbb' : undefined)};
  }
`

export const Tooltip: React.FC<Props> = (props: Props) => {
  let title
  let link
  let description

  if ('id' in props) {
    ;({ title, link, description } = tooltips[props.id] as Tooltip)
  } else {
    ;({ title, link, description } = props)
  }

  return (
    <Wrapper underline={props.underline}>
      <AxisTooltip
        title={title}
        description={description}
        link={
          link
            ? {
                text: 'Learn more',
                url: link,
              }
            : undefined
        }
      >
        {props.children}
      </AxisTooltip>
    </Wrapper>
  )
}
