import { Anchor } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import InvestmentDisclaimer from '../Footer/InvestmentDisclaimer'
import { Stack } from '../Layout'
import { Text } from '../Text'
import { Row } from './styles'

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
    <Stack gap="xsmall">
      <Row onClick={() => setOpen(!open)} role="button">
        <Text fontSize="14px" fontWeight={500}>
          Tinlake is an open DeFi protocol and marketplace for real-world asset pools. Investments can earn rewards in
          CFG tokens. <LearnMore>{open ? 'Show less' : 'Show more'}</LearnMore>
        </Text>
      </Row>
      {open && (
        <Text fontSize="14px" fontWeight={500}>
          Tinlake allows originators and owners of assets in the real world, such as trade invoices or residential
          real-estate loans, to create a pool of their assets and offer it to DeFi investors. These assets create a
          stable yield for DeFi investors and DeFi protocols. They provide liquidity for the issuers, who set up and
          operate Tinlake pools, and their borrowers. Investments can also earn automatically protocol rewards in
          Centrifuge’s native token (CFG). These rewards are independent of the Tinlake pool, its issuer, and the return
          it’s generating. This is not investment advice — please see the{' '}
          <Anchor onClick={openModal} target="_blank" style={{ display: 'inline' }}>
            Investment Disclaimer
          </Anchor>{' '}
          for more info and have a look at the{' '}
          <Anchor
            href="https://docs.centrifuge.io/getting-started/understanding-tinlake/"
            target="_blank"
            style={{ display: 'inline' }}
          >
            Tinlake documentation
          </Anchor>
          .
        </Text>
      )}

      <InvestmentDisclaimer isOpen={modalIsOpen} onClose={closeModal} />
    </Stack>
  )
}

export default TinlakeExplainer
