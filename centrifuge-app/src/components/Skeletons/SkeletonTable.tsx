import { Box, Grid } from '@centrifuge/fabric'
import styled, { keyframes, useTheme } from 'styled-components'

export const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

export const GRAY_COLOR_SKELETON = '#E9E9E9'

export const ShimmerBlock = styled(Box)`
  height: 12px;
  width: 84px;
  border-radius: 10px;
  background: linear-gradient(
    to right,
    ${GRAY_COLOR_SKELETON} 0%,
    #f0f0f0 20%,
    ${GRAY_COLOR_SKELETON} 40%,
    ${GRAY_COLOR_SKELETON} 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite ease-in-out;
`

export const RectangleBlock = styled(Box)`
  padding: 16px;
`

export const SkeletonTable = ({ rows = 12, columns = 9 }) => {
  const theme = useTheme()
  const gridTemplateColumns = `repeat(${columns}, 1fr)`

  return (
    <Grid
      gridTemplateColumns={gridTemplateColumns}
      border={`1px solid ${theme.colors.borderPrimary}`}
      borderRadius="10px"
      margin={2}
      overflow="hidden"
    >
      {Array(rows * columns)
        .fill(null)
        .map((_, index) => {
          let borderRadius = '0px'
          if (index === 0) borderRadius = '10px 0 0 0' // Top-left corner
          if (index === columns - 1) borderRadius = '0 10px 0 0' // Top-right corner
          if (index === (rows - 1) * columns) borderRadius = '0 0 0 10px' // Bottom-left corner
          if (index === rows * columns - 1) borderRadius = '0 0 10px 0' // Bottom-right corner

          return (
            <RectangleBlock
              key={index}
              backgroundColor={index < columns ? theme.colors.backgroundSecondary : theme.colors.backgroundPrimary}
              borderRadius={borderRadius}
              borderBottom={index < columns ? `1px solid ${theme.colors.borderPrimary}` : 'none'}
            >
              <ShimmerBlock backgroundColor={index < columns ? '#D9D9D9' : GRAY_COLOR_SKELETON} />
            </RectangleBlock>
          )
        })}
    </Grid>
  )
}
