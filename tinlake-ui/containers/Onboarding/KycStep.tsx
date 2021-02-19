import { KycStatusLabel } from '@centrifuge/onboarding-api/src/controllers/types'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, Paragraph } from 'grommet'
import * as React from 'react'
import config, { Pool } from '../../config'
import { OnboardingState } from '../../ducks/onboarding'
import { Step, StepBody, StepHeader, StepIcon, StepTitle } from './styles'

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
  return (
    <Step>
      <StepHeader>
        {props.kycStatus === 'processing' && <StepIcon pending />}
        {props.kycStatus !== 'processing' && (
          <StepIcon
            inactive={!props.active}
            checked={props.kycStatus === 'verified'}
            failed={props.kycStatus === 'rejected'}
          />
        )}
        <StepTitle inactive={!props.active}>
          {!props.kycStatus ||
          props.kycStatus === 'none' ||
          props.kycStatus === 'requires-signin' ||
          props.kycStatus === 'updates-required'
            ? 'Submit KYC information'
            : props.kycStatus === 'rejected'
            ? 'KYC rejected'
            : props.kycStatus === 'verified'
            ? props.accreditationStatus
              ? 'KYC status: verified'
              : 'Submit accreditation info'
            : 'KYC status: processing'}
        </StepTitle>
      </StepHeader>
      {props.active &&
        props.kycStatus &&
        (props.kycStatus === 'none' || props.kycStatus === 'updates-required' || props.kycStatus === 'expired') && (
          <StepBody>
            <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
              Submit your KYC information through Securitize for verification. This is a one time process to become an
              eligible investor for all Tinlake pools.
            </Paragraph>
            <div>
              <Button
                primary
                label={`Complete KYC on Securitize`}
                href={`${config.onboardAPIHost}pools/${
                  (props.activePool as Pool).addresses.ROOT_CONTRACT
                }/info-redirect`}
                fill={false}
                target="_blank"
              />
            </div>
            <Box margin={{ bottom: 'medium' }}>&nbsp;</Box>
          </StepBody>
        )}
      {props.active && props.kycStatus && props.kycStatus === 'rejected' && (
        <StepBody>
          <Paragraph style={{ width: '100%' }}>
            Your KYC application was declined, please reach out to{' '}
            <a href="mailto:support@centrifuge.io">support@centrifuge.io</a> for help.
          </Paragraph>
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
          <div>
            <Button primary label={`Sign in with Securitize`} href={props.onboarding.data?.kyc?.url} fill={false} />
          </div>
          <Box margin={{ bottom: 'medium' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active &&
        !!props.kycStatus &&
        props.kycStatus !== 'none' &&
        props.kycStatus !== 'requires-signin' &&
        props.kycStatus !== 'updates-required' &&
        props.kycStatus !== 'rejected' &&
        props.kycStatus !== 'expired' &&
        props.accreditationStatus && <StepBody>&nbsp;</StepBody>}
      {!props.active && <StepBody inactive>&nbsp;</StepBody>}
    </Step>
  )
}

export default KycStep
