import { Box, Button } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import InvestmentDisclaimer from '../Footer/InvestmentDisclaimer'
import { Container, Primer, Row, Text } from './styles'

const LearnMore = styled.span`
  text-decoration: underline;
`

const TinlakeExplainer: React.FC = () => {
  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const openModal = () => {
    setModalIsOpen(true)
  }
  const closeModal = () => {
    setModalIsOpen(false)
  }

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
        <Text style={{ borderBottom: '1px solid #d8d8d8' }}>
          The Tinlake protocol is rewarding every Tinlake investment daily in CFG token, the Centrifuge Chain’s native
          token. The Investment Reward Rate (APR)” is an annualized representation of these rewards considering the
          current CFG token market price taken from Uniswap and current daily Tinlake protocol reward rate (see related
          governance discussions and decisions{' '}
          <a href="https://gov.centrifuge.io/c/governance/35" target="_blank">
            here
          </a>
          ). Note that these are rewards from the protocol for providing liquidity to the ecosystem independent from the
          pool, it’s issuers, their asset originators, or any Centrifuge entity. There is no guarantee that an investor
          will receive those rewards nor that the current annualized reward APR will be met. This is not investment
          advice — please see the{' '}
          <a onClick={openModal} href="#">
            Investment Disclaimer
          </a>{' '}
          for more info.
          <Box justify="center">
            <Box margin={{ top: '24px', bottom: 'medium', left: 'auto', right: 'auto' }}>
              <Button
                secondary
                label="Get started"
                href="https://developer.centrifuge.io/learn/understanding-tinlake/"
                target="_blank"
                fill={false}
              />
            </Box>
          </Box>
        </Text>
      )}

      <InvestmentDisclaimer isOpen={modalIsOpen} onClose={closeModal} />
    </Container>
  )
}

export default TinlakeExplainer
