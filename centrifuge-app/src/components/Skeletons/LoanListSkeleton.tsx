import { Box, Grid } from '@centrifuge/fabric'
import styled, { keyframes, useTheme } from 'styled-components'
import { GRAY_COLOR_SKELETON, SkeletonTable } from './SkeletonTable'

export const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

export const ShimmerBlock = styled(Box)`
  background: linear-gradient(
    to right,
    ${GRAY_COLOR_SKELETON} 0%,
    #e0e0e0 20%,
    ${GRAY_COLOR_SKELETON} 40%,
    ${GRAY_COLOR_SKELETON} 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite ease-in-out;
`

export const LoanListSkeleton = () => {
  const theme = useTheme()
  return (
    <Box margin={2}>
      <Grid
        backgroundColor={theme.colors.backgroundSecondary}
        gridTemplateColumns={`repeat(6, 1fr)`}
        margin={2}
        borderRadius={10}
        border={`1px solid ${theme.colors.borderPrimary}`}
        py={1}
      >
        {Array(5)
          .fill(null)
          .map((item, index) => (
            <ShimmerBlock key={`skeleton-loan-list-${index}`} margin={2} height={58} />
          ))}
        <Box
          alignSelf="center"
          height={36}
          backgroundColor={theme.colors.textGold}
          margin={2}
          borderRadius={4}
          ml={4}
        />
      </Grid>

      <Box
        margin={2}
        paddingY={1}
        flexDirection="row"
        justifyContent="space-between"
        display="flex"
        alignItems="center"
      >
        <ShimmerBlock width={84} borderRadius="10px" height={12} />
        <Grid gridTemplateColumns={['200px 138px']} gap={2}>
          <ShimmerBlock borderRadius="4px" height={36} />
          <ShimmerBlock borderRadius="4px" height={36} />
        </Grid>
      </Box>

      <SkeletonTable />
    </Box>
  )
}
