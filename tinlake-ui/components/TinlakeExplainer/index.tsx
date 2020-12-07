import { Anchor } from 'grommet'
import { FormDown } from 'grommet-icons'
import * as React from 'react'
import styled from 'styled-components'

const TinlakeExplainer: React.FC = () => {
  const [open, setOpen] = React.useState(false)

  return (
    <Container>
      <Row onClick={() => setOpen(!open)}>
        <Primer>
          Tinlake is an open market place of real-world asset pools. Explore the pools and start investing now.
        </Primer>
        <Btn>
          Learn more{' '}
          <Caret>
            <FormDown style={{ transform: open ? 'rotate(-180deg)' : '' }} />
          </Caret>
        </Btn>
      </Row>
      {open && (
        <Text>
          Tinlake is an open market place of asset pools bringing together Asset Originators and Investors that seek to
          utilize the full potential of Decentralized Finance (DeFi). Asset Originators can responsibly bridge
          real-world assets into DeFi and access bankless liquidity. Investors can earn attractive yields on different
          tokenized real-world assets such as invoices, mortgages or streaming royalties. Tinlake’s smart contract
          platform coordinates the different parties required to structure, administer and finance collateralized pools
          of these real-world assets.
          <Anchor
            margin={{ left: 'xsmall', top: 'small' }}
            href="https://centrifuge.io/products/tinlake/"
            target="_blank"
            label="Learn more"
          />
        </Text>
      )}
    </Container>
  )
}

export default TinlakeExplainer

const Container = styled.div`
  flex: 1;
  border-bottom: 1px solid #d8d8d8;
  padding-bottom: 16px;
`

const Row = styled.div`
  cursor: pointer;
  display: flex;
`

const Primer = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  color: #0828be;
`

const Btn = styled.div`
  margin-left: auto;
  display: flex;
  flex-direction: row;
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  color: #333;
  text-decoration: underline;
`

const Caret = styled.div`
  height: 24px;
  margin-left: 10px;
  svg {
    transition: 200ms;
    transform-style: preserve-3d;
  }
`

const Text = styled.div`
  margin-top: 16px;
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  color: #333;
`
