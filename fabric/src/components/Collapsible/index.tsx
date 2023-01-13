import * as React from 'react'
import styled from 'styled-components'
import IconChevronDown from '../../icon/IconChevronDown'
import { Box } from '../Box'

const Root = styled(Box)<{ open: boolean; delay: number }>`
  visibility: ${({ open }) => (open ? 'visible' : 'hidden')};
  transition: ${({ open, delay }) => `visibility 0ms ${open ? 0 : delay}ms`};
`

export type CollapsibleProps = {
  open: boolean
  children: React.ReactNode
}

export const CollapsibleChevron = styled(IconChevronDown)<{ open: boolean }>`
  transform: ${({ open }) => `rotate(${open ? -180 : 0}deg)`};
  transition: transform 0.25s;
`

export function Collapsible({ open, children }: CollapsibleProps) {
  const duration = 250
  const root = React.useRef<HTMLDivElement>(null)
  const [enhanced, setEnhanced] = React.useState(false)
  let animation: Animation | undefined = undefined

  React.useEffect(() => {
    setEnhanced(root?.current?.animate !== undefined)
  }, [root])

  React.useEffect(() => {
    if (enhanced) {
      animate()
    }
  }, [open, enhanced])

  function animate() {
    if (animation) {
      animation.onfinish = () => {}
    }

    animation = root?.current?.animate(
      {
        height: [`${root?.current?.clientHeight}px`, open ? `${root?.current?.scrollHeight}px` : '0px'],
      },
      {
        duration,
        easing: 'cubic-bezier(.17, .67, .35, .98)',
        fill: 'both',
      }
    )

    if (open && animation) {
      animation.onfinish = () => {
        root?.current?.animate({ height: 'auto' }, { duration: 0.1, fill: 'both' })
      }
    }
  }

  return (
    <Root ref={root} aria-hidden={!open} height={open ? 'auto' : 0} overflow="hidden" open={open} delay={duration}>
      {children}
    </Root>
  )
}
