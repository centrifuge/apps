import { Box, Button } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import { Container, Primer, Row, Text } from './styles'

const LearnMore = styled.span`
  text-decoration: underline;
`

const TinlakeExplainer: React.FC = () => {
  const [open, setOpen] = React.useState(false)

  return (
    <Container>
      <Row onClick={() => setOpen(!open)} role="button">
        <Primer>
          Tinlake is an open market place of real-world asset pools. Investments earn rewards in CFG token.{' '}
          <LearnMore>Learn more</LearnMore>
        </Primer>
      </Row>
      {open && (
        <Text>
          The Tinlake protocol is rewarding every Tinlake investment daily in CFG token, the Centrifuge Chain’s native
          token. The “Annualized reward APR” is an annualized representation of these rewards considering the current
          CFG token market price taken from uniswap and current daily Tinlake protocol reward rate (see related
          governance discussions and decisions [here](https://gov.centrifuge.io/c/governance/35)). Note that these are
          rewards from the protocol for providing liquidity to the ecosystem independent from the pool, it’s issuers,
          their asset originators, or any Centrifuge entity. There is no guarantee that an investor will receive those
          rewards nor that the current annualized reward APR will be met. This is not investment advice - please see the
          [Investment disclaimer](open investment disclaimer on click) for more info.
          <Box justify="center">
            <Box margin={{ bottom: 'small', left: 'auto', right: 'auto' }}>
              <Button
                primary
                label="Read more about Tinlake"
                href="https://developer.centrifuge.io/learn/understanding-tinlake/"
                target="_blank"
                fill={false}
              />
            </Box>
          </Box>
        </Text>
      )}
    </Container>
  )
}

export default TinlakeExplainer
