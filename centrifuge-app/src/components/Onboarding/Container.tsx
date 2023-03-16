import { Box, Grid, IconX, Spinner } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

type ContainerProps = {
  children: React.ReactNode
  aside?: React.ReactNode
  isLoading?: boolean
  closeable?: boolean
}

const Close = styled(Link)`
  position: absolute;
  top: 0;
  right: 0;
  width: ${({ theme }) => theme.sizes.iconMedium}px;
  height: ${({ theme }) => theme.sizes.iconMedium}px;
  border-radius: ${({ theme }) => theme.radii.tooltip}px;

  &:focus-visible {
    outline: ${({ theme }) => `1px solid ${theme.colors.accentPrimary}`};
  }
`

export function Container({ children, aside, isLoading, closeable = true }: ContainerProps) {
  return (
    <Grid as="main" gridTemplateColumns="1fr" gridTemplateRows="1fr" p={6} style={{ placeItems: 'center' }}>
      <Grid
        as="article"
        position="relative"
        gridTemplateColumns={aside ? ['350px 1fr 0'] : ['1fr 0']}
        gridTemplateAreas={aside ? `"aside content close"` : `"content close"`}
        width="100%"
        height="100%"
        maxWidth="1200px"
        maxHeight="900px"
        overflowY="auto"
        backgroundColor="backgroundPrimary"
        borderRadius={18}
      >
        {isLoading ? (
          <Box position="absolute" top="50%" left="50%" style={{ transform: 'translate(-50%, -50%)' }}>
            <Spinner size="iconLarge" />
          </Box>
        ) : (
          <>
            {closeable && (
              <Box position="sticky" top={3} right={3} gridArea="close" width={0} height={0} overflow="visible">
                <Close to="/" title="Go to main page">
                  <IconX color="textPrimary" size="iconMedium" />
                </Close>
              </Box>
            )}

            {aside && (
              <Box
                as="aside"
                gridArea="aside"
                px={6}
                py={8}
                borderWidth={0}
                borderRightWidth={1}
                borderStyle="solid"
                borderColor="borderPrimary"
              >
                <Box position="sticky" top={8} left={0} pt={2}>
                  {aside}
                </Box>
              </Box>
            )}

            {/*
              This container expects exactly one or two children.
              The second child will always be aligned at the bottom.
            */}
            <Grid
              as="section"
              gridArea="content"
              gridTemplateColumns="1fr"
              gridTemplateRows="1fr auto"
              gap={4}
              px={6}
              py={8}
            >
              {children}
            </Grid>
          </>
        )}
      </Grid>
    </Grid>
  )
}
