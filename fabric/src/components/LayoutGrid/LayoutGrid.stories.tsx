import React from 'react'
import { LayoutGrid, LayoutGridItem } from '.'
import { Box } from '../Box'

export default {
  title: 'Components/LayoutGrid',
}

export const Default: React.FC = () => {
  return (
    <LayoutGrid>
      <LayoutGridItem span={[4, 8, 12]}>
        <Box backgroundColor="brand" height={100} />
      </LayoutGridItem>

      <LayoutGridItem span={[4, 4, 6]}>
        <Box backgroundColor="brand" height={100} />
      </LayoutGridItem>

      <LayoutGridItem span={[4, 4, 6]}>
        <Box backgroundColor="brand" height={100} />
      </LayoutGridItem>

      <LayoutGridItem span={[4, 5, 8]}>
        <Box backgroundColor="brand" height={100} />
      </LayoutGridItem>

      <LayoutGridItem span={[4, 3, 4]}>
        <Box backgroundColor="brand" height={100} />
      </LayoutGridItem>

      <LayoutGridItem span={[4, 6, 8]} push={[0, 1, 2]}>
        <Box backgroundColor="brand" height={100} />
      </LayoutGridItem>

      <LayoutGridItem span={4} push={[0, 1, 2]}>
        <Box backgroundColor="brand" height={100} />
      </LayoutGridItem>

      <LayoutGridItem span={4}>
        <Box backgroundColor="brand" height={100} />
      </LayoutGridItem>

      <LayoutGridItem span={[4, 8, 4]}>
        <Box backgroundColor="brand" height={100} />
      </LayoutGridItem>
    </LayoutGrid>
  )
}
