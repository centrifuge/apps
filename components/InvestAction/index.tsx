import * as React from 'react'
import styled from 'styled-components'
import { Box, Button, Paragraph, CheckBox, FormField, TextInput, Select } from 'grommet'
import { Modal } from '@centrifuge/axis-modal'

import { countryList } from './countries'

const InvestmentSteps = styled.img`
  max-width: 600px;
  margin: 20px auto;
`

interface Props {}

interface State {
  open: boolean
}

class InvestAction extends React.Component<Props, State> {
  state: State = {
    open: false,
  }

  onOpen = () => {
    this.setState({ open: true })
  }

  onClose = () => {
    this.setState({ open: false })
  }

  render() {
    return (
      <Box>
        <Button primary label="Invest" margin={{ left: 'auto', vertical: 'large' }} onClick={this.onOpen} />

        <Modal opened={this.state.open} title={'Interested in investing?'} onClose={this.onClose}>
          <InvestmentSteps src="../../static/invest-steps1.png" alt="Investment steps" />
          <Paragraph margin={{ top: 'medium', bottom: 'medium' }}>
            To invest in this pool please provide your information to go through KYC. Submit your information below to
            start the KYC and onboarding process. The Issuer will shortly reach out to you.
          </Paragraph>

          <Box direction="row" margin={{ bottom: 'medium' }}>
            <Box basis={'1/4'}>
              <CheckBox name="check" checked={true} label="Mr." onChange={(event) => console.log(event)} />
            </Box>
            <Box basis={'1/4'}>
              <CheckBox name="check" checked={true} label="Ms." onChange={(event) => console.log(event)} />
            </Box>
          </Box>

          <Box direction="row" gap={'medium'}>
            <Box basis={'1/2'}>
              <FormField label="Given Name" margin={{ bottom: 'medium' }}>
                <TextInput />
              </FormField>
              <FormField label="Email" margin={{ bottom: 'medium' }}>
                <TextInput />
              </FormField>
              <FormField label="Type of Investor">
                <Select
                  placeholder="Select Investor Type"
                  options={['Individual', 'Representing a legal entity']}
                  onChange={() => {}}
                />
              </FormField>
            </Box>
            <Box basis={'1/2'}>
              <FormField label="Surname" margin={{ bottom: 'medium' }}>
                <TextInput />
              </FormField>
              <FormField label="Country of Residence" margin={{ bottom: 'medium' }}>
                <Select placeholder="Select a country" options={countryList} onChange={() => {}} />
              </FormField>
              <FormField label="Estimated Size of Investment, USD">
                <Select
                  placeholder="Select Investment Size"
                  options={['<25,000 USD', '25,000-50,000 USD', '>50,000 USD']}
                  onChange={() => {}}
                />
              </FormField>
            </Box>
          </Box>

          <Box direction="row" margin={{ top: 'small' }}>
            <Box style={{ minWidth: '40px', paddingTop: '20px' }}>
              <CheckBox name="check" checked={true} onChange={(event) => console.log(event)} />
            </Box>
            <Box flex={'grow'}>
              <Paragraph>
                I hereby confirm that I’m or I’m representing either:
                <br />
                A non-US investor not located in a jurisdiction restricting the purchase and holding of crypto assets
                <br />
                or
                <br />A US accredited investor, and I’m able to prove my accredited investor status to the Issuer.
              </Paragraph>
            </Box>
          </Box>

          <Paragraph margin={{ top: 'small', bottom: 'small' }}>
            Any questions left? Feel free to reach out to the Issuer directly (see{' '}
            <a href="#" onClick={this.onClose}>
              Pool Overview
            </a>
            ).
          </Paragraph>

          <Box direction="row" justify="end">
            <Box basis={'1/5'}>
              <Button primary onClick={this.onClose} label="Submit" fill={true} />
            </Box>
          </Box>
        </Modal>
      </Box>
    )
  }
}

export default InvestAction
