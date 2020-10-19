import * as React from 'react'

import { RatioBar } from '@centrifuge/axis-ratio-bar'

interface Props {
  current?: number
  min?: number
  max?: number
}

export const TINRatioBar: React.FC<Props> = (props: Props) => {
  const [segments, setSegments] = React.useState<any[]>([])

  React.useEffect(() => {
    if (props.current !== undefined && props.min !== undefined && props.max !== undefined) {
      const minSegments = [
        {
          width: props.min * 100,
          backgroundColor: '#0828BE',
          separator: {
            text: `Min: ${Math.round(props.min * 100)}%`,
            color: '#000',
            position: 'bottom',
          },
        },
        {
          width: props.current * 100 - props.min * 100,
          backgroundColor: '#0828BE',
          separator: {
            text: `Current: ${Math.round(props.current * 100)}%`,
            color: '#0828BE',
            position: 'top',
          },
        },
      ]

      // Only add the max separator if it max !== 100%
      const maxSegments =
        props.max !== 1.0
          ? [
              {
                width: props.max * 100 - props.current * 100 - props.min * 100,
                backgroundColor: '#D8D8D8',
                separator: {
                  text: `Max: ${Math.round(props.max * 100)}%`,
                  color: '#000',
                  position: 'bottom',
                },
              },
              {
                width: 100 - props.max * 100,
                backgroundColor: '#D8D8D8',
              },
            ]
          : [
              {
                width: 100 - props.current * 100 - props.min * 100,
                backgroundColor: '#D8D8D8',
              },
            ]

      const newSegments = [...minSegments, ...maxSegments]

      setSegments(newSegments)
    } else {
      setSegments([
        {
          width: 100,
          backgroundColor: '#D8D8D8',
        },
      ])
    }
  }, [props.min, props.current, props.max])

  return segments ? <RatioBar labels={{ left: 'TIN', right: 'DROP' }} segments={segments} /> : null
}
