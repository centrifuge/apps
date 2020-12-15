import { Tooltip as AxisTooltip } from '@centrifuge/axis-tooltip'
import * as React from 'react'
import tooltips from '../../static/tooltips.json'

interface Props {
  id: keyof typeof tooltips
  children: React.ReactNode
}

// TODO: this is an experiment for better indicating tooltips, but should be improved upon at a later time
// const Wrapper = styled.div`
//   &:hover {
//     &::after {
//       content: ' ?';
//       margin-left: 8px;
//       background: rgba(0, 0, 0, 0.8);
//       color: #fff;
//       padding: 3px 7px 3px 4px;
//       font-weight: bold;
//       border-radius: 100%;
//       font-size: 12px;
//     }
//   }
// `

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
