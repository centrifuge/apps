import { KycStatusLabel } from '@centrifuge/onboard-api/src/controllers/types'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Anchor, Box, Button, CheckBox, Paragraph } from 'grommet'
import * as React from 'react'
import config, { Pool } from '../../config'
import { OnboardingState } from '../../ducks/onboarding'
import { FormFieldWithoutBorder, LegalCopy, Step, StepBody, StepHeader, StepIcon, StepTitle } from './styles'
import { Modal } from '@centrifuge/axis-modal'
import { StatusInfo as StatusInfoIcon } from 'grommet-icons'

interface Props {
  activePool: Pool
  tinlake: ITinlake
  active: boolean
  onboarding: OnboardingState
  kycStatus: KycStatusLabel | 'requires-signin' | undefined
  accreditationStatus: boolean
}

const RequiresInputStates = ['none', 'updates-required', 'rejected', 'expired']

const KycStep: React.FC<Props> = (props: Props) => {
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
        {props.kycStatus === 'processing' && <StepIcon pending />}
        {props.kycStatus !== 'processing' && (
          <StepIcon inactive={!props.active} checked={props.kycStatus === 'verified'} />
        )}
        <StepTitle inactive={!props.active}>
          {!props.kycStatus ||
          props.kycStatus === 'none' ||
          props.kycStatus === 'requires-signin' ||
          props.kycStatus === 'updates-required'
            ? 'Submit KYC information'
            : props.kycStatus === 'verified'
            ? props.accreditationStatus
              ? 'KYC status: verified'
              : 'Submit accreditation info'
            : 'KYC status: processing'}
        </StepTitle>
      </StepHeader>
      {props.active && !props.kycStatus && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            Tinlake has integrated Securitize.io’s automated KYC process for investor onboarding. This is a one time
            process to become an eligible investor for all Tinlake pools. Once Securitize has verified your
            documentation you will be provided with your “Securitize iD” which makes you eligible to invest in all open
            Tinlake pools. To invest in an individual pool you will be asked to sign the subscription agreement with the
            pool’s issuer in the next step.
          </Paragraph>
          <Box margin={{ top: 'medium', left: 'auto', right: 'auto', bottom: 'medium' }}>
            <FormFieldWithoutBorder error={error}>
              <CheckBox
                checked={checked}
                label={
                  <div>
                    Consent to share personal information with Securitize, which Securitize may transfer to Centrifuge
                    and issuers chosen by the you (the investor). &nbsp;
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
            <Button
              primary
              label={`Start KYC now`}
              href={props.onboarding.data?.kyc?.url}
              onClick={(event: any) => {
                if (!checked) {
                  event.preventDefault()
                  setError('This needs to be checked to proceed.')
                }
              }}
              fill={false}
            />
          </div>
          <Box margin={{ bottom: 'small' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active && props.kycStatus && RequiresInputStates.includes(props.kycStatus) && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            You have already started the onboarding process with Securitize. To complete this step, please finalize your
            KYC information on Securitize.
          </Paragraph>
          <div>
            <Button
              primary
              label={`Complete KYC on Securitize`}
              href={`${config.onboardAPIHost}pools/${(props.activePool as Pool).addresses.ROOT_CONTRACT}/info-redirect`}
              fill={false}
              target="_blank"
            />
          </div>
          <Box margin={{ bottom: 'medium' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active && props.kycStatus === 'verified' && !props.accreditationStatus && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            Your KYC submission has been verified, but you still need to finish accreditation as a US tax resident. To
            complete this step, please finalize your accreditation information on Securitize.io.
          </Paragraph>
          <div>
            <Button
              primary
              label={`Complete accreditation on Securitize`}
              href={`${config.onboardAPIHost}pools/${(props.activePool as Pool).addresses.ROOT_CONTRACT}/info-redirect`}
              fill={false}
              target="_blank"
            />
          </div>
          <Box margin={{ bottom: 'medium' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active && props.kycStatus === 'requires-signin' && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            To continue with onboarding, you need to sign in again with your Securitize iD.
          </Paragraph>
          <Box margin={{ left: 'auto', right: 'auto', bottom: 'medium' }}>
            <FormFieldWithoutBorder error={error}>
              <CheckBox
                checked={checked}
                label="I accept the data privacy policy and that data is shared with Centrifuge and the issuer."
                onChange={(event) => setChecked(event.target.checked)}
              />
            </FormFieldWithoutBorder>
          </Box>
          <div>
            <Button
              primary
              label={`Sign in with Securitize`}
              href={props.onboarding.data?.kyc?.url}
              onClick={(event: any) => {
                if (!checked) {
                  event.preventDefault()
                  setError('This needs to be checked to proceed.')
                }
              }}
              fill={false}
            />
          </div>
          <Box margin={{ bottom: 'medium' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active &&
        !!props.kycStatus &&
        props.kycStatus !== 'none' &&
        props.kycStatus !== 'requires-signin' &&
        props.kycStatus !== 'updates-required' &&
        props.accreditationStatus && <StepBody>&nbsp;</StepBody>}
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

export default KycStep
