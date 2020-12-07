import { Tooltip as AxisTooltip } from '@centrifuge/axis-tooltip'
import * as React from 'react'
import tooltips from '../../static/tooltips.json'

interface Props {
  id: keyof typeof tooltips
  children: React.ReactNode
}

export const Tooltip: React.FC<Props> = (props: Props) => {
  return props.id in tooltips ? (
    <AxisTooltip
      title={tooltips[props.id].title}
      description={tooltips[props.id].description}
      link={
        'link' in tooltips[props.id]
          ? {
              text: 'Learn more',
              url: (tooltips[props.id] as any).link,
            }
          : undefined
      }
    >
      {props.children}
    </AxisTooltip>
  ) : (
    <>{props.children}</>
  )
}
