import * as React from 'react'
import { Tooltip } from '.'
import { Shelf } from '../Shelf'

export default {
  title: 'Components/Tooltip',
}

export const Default: React.FC = () => {
  return (
    <Shelf gap={2} pt={8}>
      <Tooltip title="Optional tooltip title" body="Tooltip body">
        I have a tooltip
      </Tooltip>
      <Tooltip body="Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorem fugiat quos distinctio assumenda hic provident natus officiis repellat laudantium dolore, nisi vitae harum ab non exercitationem tempore obcaecati maxime reiciendis.">
        I have a tooltip
      </Tooltip>
    </Shelf>
  )
}
