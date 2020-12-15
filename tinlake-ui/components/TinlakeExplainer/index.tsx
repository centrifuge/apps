import { Box, Button } from 'grommet'
import { FormDown } from 'grommet-icons'
import * as React from 'react'
import { Btn, Caret, Container, Primer, Row, Text } from './styles'

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
          <Box justify="center">
            <Box margin={{ bottom: 'small', left: 'auto', right: 'auto' }}>
              <Button
                primary
                label="Read more about Tinlake"
                href="https://centrifuge.io/products/tinlake/"
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
