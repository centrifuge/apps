import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, CheckBox, Paragraph } from 'grommet'
import * as React from 'react'
import { Pool } from '../../config'
import { OnboardingState } from '../../ducks/onboarding'
import Spinner from './Spinner'
import { Step, StepHeader, StepIcon, StepTitle, StepBody, FormFieldWithoutBorder } from './styles'

interface Props {
  activePool: Pool
  tinlake: ITinlake
  active: boolean
  onboarding: OnboardingState
  kycStatus: 'none' | 'created' | 'verified' | 'requires-signin'
}

const KycStep: React.FC<Props> = (props: Props) => {
  const [checked, setChecked] = React.useState(false)
  const [error, setError] = React.useState('')

  return (
    <Step>
      <StepHeader>
        {props.kycStatus === 'created' && <Spinner />}
        {props.kycStatus !== 'created' && (
          <StepIcon inactive={!props.active} checked={props.kycStatus === 'verified'} />
        )}
        <StepTitle inactive={!props.active}>
          {props.kycStatus === 'none' || props.kycStatus === 'requires-signin'
            ? 'Submit KYC information'
            : props.kycStatus === 'verified'
            ? 'KYC status: verified'
            : 'KYC status: awaiting verification'}
        </StepTitle>
      </StepHeader>
      {props.active && props.kycStatus === 'none' && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            Tinlake has integrated Securitize.io’s automated KYC process for investor onboarding. This is a one time
            process to become an eligible investor for all Tinlake pools. Once Securitize has verified your
            documentation you will be provided with your “Securitize iD” which makes you eligible to invest in all open
            Tinlake pools. To invest in an individual pool you will be asked to sign the subscription agreement with the
            pool’s issuer, signed through DocuSign. Once the issuer has countersigned, you are ready to invest.
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
      {props.active && props.kycStatus !== 'none' && props.kycStatus !== 'requires-signin' && (
        <StepBody>&nbsp;</StepBody>
      )}
      {!props.active && <StepBody inactive>&nbsp;</StepBody>}
    </Step>
  )
}

export default KycStep
