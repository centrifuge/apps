import { Anchor, Box, Button } from 'grommet'
import * as React from 'react'
import { Pool } from '../../config'
import { HelpIcon } from './styles'
import config from '../../config'
import { Modal } from '@centrifuge/axis-modal'
import { StatusInfo as StatusInfoIcon } from 'grommet-icons'

interface Props {
  activePool: Pool
}

const InfoBox: React.FC<Props> = (props: Props) => {
  const [countries, setCountries] = React.useState([] as any[])

  React.useEffect(() => {
    ;(async () => {
      const req = await fetch(
        `${config.onboardAPIHost}pools/${props.activePool.addresses.ROOT_CONTRACT}/restricted-countries`
      )
      const body = await req.json()
      setCountries(body)
    })()
  }, [props.activePool])

  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const openModal = () => {
    setModalIsOpen(true)
  }
  const closeModal = () => {
    setModalIsOpen(false)
  }

  return (
    <Box background="#eee" pad="medium" round="xsmall" style={{ color: '#555555' }}>
      <Box direction="row" pad={'0 0 14px'}>
        <HelpIcon src="/static/help-circle.svg" />
        <h3 style={{ margin: 0 }}>How onboarding works</h3>
      </Box>
      Tinlake pools are backed by real-world assets. Financing those assets on-chain requires a legal structure that
      give the investors a legal claim on the assets. <br /> <br />
      The underlying legal structure requires investors to
      <ol style={{ paddingLeft: '30px', listStyleType: 'lower-roman' }}>
        <li>Clear standard KYC checks;</li>
        <li>Sign a subscription agreement with the pools issuer.</li>
      </ol>
      Currently, the underlying legal structures may also impose some restrictions on investments. E.g. most pools
      require a minimum investment amount of 5.000 DAI. Residents of some countries may also be excluded from investing.
      <br />
      <br />
      <Anchor href="https://centrifuge.hackmd.io/QXUCI0wRSLepfABBivNruw?view" target="_blank">
        Read the onboarding guide
      </Anchor>
      <Anchor onClick={() => openModal()}>See list of excluded countries</Anchor>
      <Modal
        opened={modalIsOpen}
        title={`List of excluded countries for ${
          props.activePool.metadata.shortName || props.activePool.metadata.name
        }.`}
        headingProps={{ style: { maxWidth: '100%', display: 'flex' } }}
        titleIcon={<StatusInfoIcon />}
        onClose={closeModal}
      >
        <ul>
          {countries.map((country: { code: string; name: string }) => (
            <li>{country.name}</li>
          ))}
        </ul>

        <Box direction="row" justify="end">
          <Box basis={'1/5'}>
            <Button primary onClick={closeModal} label="OK" fill={true} />
          </Box>
        </Box>
      </Modal>
    </Box>
  )
}

export default InfoBox
