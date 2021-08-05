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
        <Text>
          Tinlake allows DeFi investors to invest in pools of real-world assets, such as invoices, trade receivables or
          residential real estate loans. These assets create a stable yield for DeFi investors and DeFi protocols who
          provide the liquidity. Tinlake investments also earn daily rewards in Centrifuge's native token (CFG). These
          rewards are independent from the pool's issuer and governed by the{' '}
          <a href="https://gov.centrifuge.io/c/governance/35" target="_blank">
            Centrifuge Community
          </a>
          . This is not investment advice — please see the{' '}
          <a onClick={openModal} href="#">
            Investment Disclaimer
          </a>{' '}
          for more info and have a look at the{' '}
          <a href="https://developer.centrifuge.io/learn/understanding-tinlake/" target="_blank">
            Tinlake documentation
          </a>
        </Text>
      )}

      <InvestmentDisclaimer isOpen={modalIsOpen} onClose={closeModal} />
    </Container>
  )
}

export default TinlakeExplainer
