import { Modal } from '@centrifuge/axis-modal'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Anchor, Box, Button, CheckBox, Paragraph } from 'grommet'
import { StatusInfo as StatusInfoIcon } from 'grommet-icons'
import * as React from 'react'
import { Pool } from '../../config'
import { OnboardingState } from '../../ducks/onboarding'
import { FormFieldWithoutBorder, LegalCopy, Step, StepBody, StepHeader, StepIcon, StepTitle } from './styles'

interface Props {
  activePool: Pool
  tinlake: ITinlake
  active: boolean
  linked: boolean
  onboarding: OnboardingState
}

const LinkStep: React.FC<Props> = (props: Props) => {
  const [checked, setChecked] = React.useState(false)
  const [error, setError] = React.useState('')

  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const openModal = () => {
    setModalIsOpen(true)
  }
  const closeModal = () => {
    setModalIsOpen(false)
  }

  return (
    <Step>
      <StepHeader>
        <StepIcon inactive={!props.active} checked={props.linked} />
        <StepTitle inactive={!props.active}>Link Securitize account</StepTitle>
      </StepHeader>
      {props.active && !props.linked && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            Tinlake has integrated Securitize’s automated KYC process for investor onboarding. Please first link an
            existing Securitize account to your connected Ethereum address or set-up a new Securitize account. This is a
            one-time step.
          </Paragraph>
          <Box margin={{ top: 'medium', left: 'auto', right: 'auto', bottom: 'medium' }}>
            <FormFieldWithoutBorder error={error}>
              <CheckBox
                checked={checked}
                label={
                  <div>
                    I consent to share personal information with Securitize, which Securitize may transfer to Centrifuge
                    and issuers chosen by you (the investor). &nbsp;
                    <Anchor
                      onClick={(event: any) => {
                        openModal()
                        event.preventDefault()
                      }}
                      style={{}}
                      label="View more"
                    />
                    .
                  </div>
                }
                onChange={(event) => setChecked(event.target.checked)}
              />
            </FormFieldWithoutBorder>
          </Box>
          <div>
            <Box direction="row" gap="small">
              <Button
                primary
                label={`Link Securitize account`}
                href={`${props.onboarding.data?.kyc?.url}&registration=true`}
                onClick={(event: any) => {
                  if (!checked) {
                    event.preventDefault()
                    setError('This needs to be checked to proceed.')
                  }
                }}
                fill={false}
              />
            </Box>
          </div>
          <Box margin={{ bottom: 'small' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active && !!props.linked && <StepBody>&nbsp;</StepBody>}
      {!props.active && <StepBody inactive>&nbsp;</StepBody>}

      <Modal
        opened={modalIsOpen}
        title={
          'Consent to share personal information with Securitize, which Securitize may transfer to Centrifuge and issuers chosen by the you (the investor).'
        }
        headingProps={{ style: { maxWidth: '100%', display: 'flex' } }}
        titleIcon={<StatusInfoIcon />}
        onClose={closeModal}
      >
        <LegalCopy>
          <Paragraph margin={{ top: 'medium' }}>
            The investor onboarding and due diligence process, also known as KYC (Know Your Customer) will be performed
            by{' '}
            <Anchor style={{ color: '#0828be' }} href="https://www.securitize.io/" target="_blank">
              Securitize
            </Anchor>
            . Investors will disclose their personal data to Securitize. Investors located in the European Economic Area
            (“EEA”) or the United Kingdom should be aware that these disclosures may involve transfers to countries that
            do not provide the same level of protection for personal data as their home countries. Please note that this
            Data Transfer Consent Form should be read in conjunction with Securitize's GLBA Privacy Notice and (for EEA
            and UK residents) GDPR Privacy Notice. Any defined terms not defined herein take their meaning from those
            notices or the Securitize Platform Terms of Service.
          </Paragraph>
          <Paragraph margin={{ bottom: 'medium' }}>
            Securitize will access and transfer your personal data to the issuer the investor identifies later on. That
            issuer may be located in the United States or in other jurisdictions outside the EEA or the United Kingdom.
            Securitize will disclose your personal data stored in your “Securitize I.D.” for the purpose set forth
            above. That information includes each category of personal data identified in the Securitze GLBA Notice or
            GDPR Notice, as applicable.
          </Paragraph>
        </LegalCopy>

        <Box direction="row" justify="end">
          <Box basis={'1/5'}>
            <Button primary onClick={closeModal} label="OK" fill={true} />
          </Box>
        </Box>
      </Modal>
    </Step>
  )
}

export default LinkStep
