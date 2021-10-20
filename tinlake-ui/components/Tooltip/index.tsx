import { Tooltip as AxisTooltip } from '@centrifuge/axis-tooltip'
import * as React from 'react'
import styled from 'styled-components'
import tooltips from '../../public/static/tooltips.json'

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

interface ITooltip {
  title: string
  link?: string
  description?: string
}

type Props = PropsWithID | PropsWithoutID

const Wrapper = styled.span<{ underline?: boolean; fix?: boolean }>`
  @media (pointer: fine) {
    [data-tip] > *,
    [data-tip] {
      border-bottom: ${(props) => (props.underline ? '1px dotted #bbbbbb' : undefined)};
    }
  }
  /* react-tooltip doesn't play nice with SSR, so this dirty fix prevents a black line from showing on tooltip buttons */
  .__react_component_tooltip {
    ${(props) => props.fix && `display: none;`}
  }
`

let serverHandoffComplete = false

export const Tooltip: React.FC<Props> = (props: Props) => {
  const { title, link, description } = 'id' in props ? (tooltips[props.id] as ITooltip) : props
  const [fix, setFix] = React.useState(serverHandoffComplete ? false : true)

  React.useEffect(() => {
    serverHandoffComplete = true

    if (fix) {
      setFix(false)
    }
  }, [])

  return (
    <Wrapper underline={props.underline} fix={fix}>
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
