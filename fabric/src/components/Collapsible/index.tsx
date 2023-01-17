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
  const animation = React.useRef<Animation | undefined>(undefined)

  React.useEffect(() => {
    if (root?.current?.animate !== undefined) {
      animate()
    }
  }, [open])

  function animate() {
    if (animation?.current) {
      animation.current.onfinish = () => {}
    }

    animation.current = root?.current?.animate(
      {
        height: [`${root?.current?.clientHeight}px`, open ? `${root?.current?.scrollHeight}px` : '0px'],
      },
      {
        duration,
        easing: 'cubic-bezier(.17, .67, .35, .98)',
        fill: 'both',
      }
    )

    if (open && animation?.current) {
      animation.current.onfinish = () => {
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
