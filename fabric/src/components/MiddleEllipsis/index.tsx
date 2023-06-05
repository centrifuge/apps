import * as React from 'react'
import { useBreakpointChanges } from '../../utils/useBreakpointChanges'
import { Box } from '../Box'
import { Shelf } from '../Shelf'
import { Text, TextProps } from '../Text'

export type MiddleEllipsisProps = TextProps & {
  text: string
}

export function MiddleEllipsis({ text, ...textProps }: MiddleEllipsisProps) {
  const leftRef = React.useRef<HTMLDivElement>(null)
  const rightRef = React.useRef<HTMLDivElement>(null)
  const leftWidths = React.useRef<number[]>([])
  const rightWidths = React.useRef<number[]>([])
  const halfLength = Math.floor(text.length / 2)
  const left = text.slice(0, halfLength)
  const right = text.slice(halfLength)
  const [trimmed, setTrimmed] = React.useState('')

  function measureText() {
    if (!leftRef.current || !rightRef.current) return
    const lw: number[] = []
    const rw: number[] = []
    const font = window.getComputedStyle(leftRef.current).font
    for (let i = 0; i < left.length; i++) {
      lw[i] = measureWidth(`${left.slice(0, i)}…`, font)
    }
    for (let i = 0; i < right.length; i++) {
      rw[i] = measureWidth(right.slice(right.length - i - 1), font)
    }
    leftWidths.current = lw
    rightWidths.current = rw
  }

  function checkWidth() {
    if (!leftRef.current || !rightRef.current || !leftWidths.current.length) return

    let leftTrimmed: string
    let rightTrimmed: string
    let rightRemainder = 0

    const font = window.getComputedStyle(leftRef.current).font
    const rightTarget = rightRef.current.getBoundingClientRect().width
    const rightTotalWidth = measureWidth(right, font)

    if (rightTarget >= rightTotalWidth) {
      rightTrimmed = right
    } else if (rightTarget < rightWidths.current[1]) {
      rightTrimmed = ''
    } else {
      const afterIndex = rightWidths.current.findIndex((w) => w > rightTarget)
      const index = afterIndex - 1
      rightTrimmed = right.slice(-index)
      rightRemainder = rightTarget - rightWidths.current[index]
    }

    const leftTarget = leftRef.current.getBoundingClientRect().width + rightRemainder
    const leftTotalWidth = measureWidth(left, font)

    if (leftTarget >= leftTotalWidth && right === rightTrimmed) {
      leftTrimmed = left
    } else if (leftTarget < leftWidths.current[1]) {
      leftTrimmed = `${left[0]}…`
    } else {
      const afterIndex = leftWidths.current.findIndex((w) => w > leftTarget) >>> 0
      const index = afterIndex - 1
      leftTrimmed = `${left.slice(0, index)}…`
    }

    setTrimmed(`${leftTrimmed}${rightTrimmed}`)
  }

  useBreakpointChanges(measureText)

  React.useEffect(() => {
    measureText()
  }, [text])

  React.useEffect(() => {
    if (!leftRef.current || !rightRef.current || !leftWidths.current.length) return

    checkWidth()
    const obs = new ResizeObserver(() => checkWidth())
    obs.observe(leftRef.current)

    return () => {
      obs.disconnect()
    }
  }, [])

  return (
    <Shelf alignItems="baseline" position="relative" flex={1}>
      <Text {...textProps} ref={leftRef} style={{ flex: '1 1 0%', visibility: 'hidden' }}>
        {left[0]}
      </Text>
      <Box flex="1 1 0%" ref={rightRef} />
      <Text
        {...textProps}
        style={{
          position: 'absolute',
          left: '0',
          top: '0',
        }}
      >
        {trimmed}
      </Text>
    </Shelf>
  )
}

const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
const ctx = canvas?.getContext('2d')

function measureWidth(text: string, font: string) {
  if (!ctx) return 0
  ctx.font = font
  const metrics = ctx.measureText(text)
  const width = metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft
  return width
}
