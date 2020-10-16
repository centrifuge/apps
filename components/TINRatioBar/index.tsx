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
      // Only add the max separator if it max !== 100%
      const initialSegments =
        props.max !== 1.0
          ? [
              {
                width: 100 - props.max * 100,
                backgroundColor: '#0828BE',
                separator: {
                  text: `Max: ${Math.round(props.max * 100)}%`,
                  color: '#000',
                  position: 'bottom',
                },
              },
            ]
          : []

      const newSegments = [
        ...initialSegments,
        ...[
          {
            width: 100 - props.current * 100 - (100 - props.max * 100),
            backgroundColor: '#0828BE',
            separator: {
              text: `Current: ${Math.round(props.current * 100)}%`,
              color: '#0828BE',
              position: 'top',
            },
          },
          {
            width: 100 - props.min * 100 - (100 - props.current * 100) - (100 - props.max * 100),
            backgroundColor: '#D8D8D8',
            separator: {
              text: `Min: ${Math.round(props.min * 100)}%`,
              color: '#000',
              position: 'bottom',
            },
          },
          {
            width: props.min * 100,
            backgroundColor: '#D8D8D8',
          },
        ],
      ]

      setSegments(newSegments.slice(0, 1))
      setTimeout(() => {
        setSegments(newSegments.slice(0, 2))

        setTimeout(() => {
          setSegments(newSegments.slice(0, 3))

          setTimeout(() => {
            setSegments(newSegments.slice(0, 4))
          }, 1)
        }, 1)
      }, 1)
    } else {
      setSegments([
        {
          width: 100,
          backgroundColor: '#D8D8D8',
        },
      ])
    }
  }, [props.min, props.current, props.max])

  return segments ? <RatioBar labels={{ left: 'DROP', right: 'TIN' }} segments={segments} /> : null
}
