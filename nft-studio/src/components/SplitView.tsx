import { Box } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { PageContainer } from './PageContainer'

type Props = {
  left: React.ReactNode
  right: React.ReactNode
}

export const SplitView: React.FC<Props> = ({ left, right }) => {
  return (
    <PageContainer variant="overlay" noPadding>
      <Box
        flex="1"
        display="grid"
        gridTemplateColumns={['1fr', '1fr', '2fr 1fr']}
        gridAutoRows={['max-content', 'max-content', 'initial']}
      >
        <LeftWrapper color="borderPrimary" px={[1, 2, 3]}>
          {left}
        </LeftWrapper>
        <Box px={[1, 2, 3]}>{right}</Box>
      </Box>
    </PageContainer>
  )
}

const LeftWrapper = styled(Box)`
  box-shadow: 1px 1px 0 currentcolor;
`
