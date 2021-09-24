import { AddressStatus, KycStatusLabel } from '@centrifuge/onboarding-api/src/controllers/types'
import { Anchor } from 'grommet'
import * as React from 'react'
import config from '../../config'
import { Button } from '../Button'
import { Step } from './Step'
import { StepParagraph } from './StepParagraph'

interface Props {
  state: 'active' | 'todo' | 'done'
  onboardingData: AddressStatus | undefined
  kycStatus: KycStatusLabel | 'requires-signin' | undefined
  accreditationStatus: boolean
}

// TODO: Redirect to onboard API URL that isn't pool dependant
const placeholderPoolId = '0xc5BfCcBe24b037459922F70ADA6706638A550338'
const onboardURL = `${config.onboardAPIHost}pools/${placeholderPoolId}/info-redirect`

const KycStep: React.FC<Props> = ({ state, onboardingData, kycStatus, accreditationStatus }) => {
  const active = state === 'active'

  return (
    <Step
      state={state}
      title={
        !kycStatus || kycStatus === 'none' || kycStatus === 'requires-signin' || kycStatus === 'updates-required'
          ? 'Submit KYC information'
          : kycStatus === 'rejected'
          ? 'KYC rejected'
          : kycStatus === 'verified'
          ? accreditationStatus
            ? 'KYC status: verified'
            : 'Submit accreditation info'
          : 'KYC status: processing'
      }
      icon={kycStatus === 'processing' ? 'clock' : undefined}
    >
      {active && kycStatus && (kycStatus === 'none' || kycStatus === 'updates-required' || kycStatus === 'expired') && (
        <>
          <StepParagraph>
            Submit your KYC information through Securitize for verification. This is a one time process to become an
            eligible investor for all Tinlake pools.
          </StepParagraph>
          <Button primary label={`Complete KYC on Securitize`} href={onboardURL} target="_blank" />
        </>
      )}
      {active && kycStatus && kycStatus === 'rejected' && (
        <StepParagraph icon={kycStatus === 'rejected' ? 'alert' : undefined}>
          Your KYC application was declined, please reach out to{' '}
          <Anchor href="mailto:support@centrifuge.io" style={{ display: 'inline' }} label="support@centrifuge.io" /> for
          help.
        </StepParagraph>
      )}
      {active && kycStatus === 'verified' && !accreditationStatus && (
        <>
          <StepParagraph>
            Your KYC submission has been verified, but you still need to finish accreditation as a US tax resident. To
            complete this step, please submit your accreditation information on InvestReady. Make sure you use the same
            email address here that you entered on Securitize. If you experience any issues, please contact{' '}
            <Anchor href="mailto:support@centrifuge.io" style={{ display: 'inline' }} label="support@centrifuge.io" />.
          </StepParagraph>
          <Button
            primary
            largeOnMobile={false}
            label={`Complete accreditation on InvestReady`}
            href={'https://centrifuge.investready.com/signup?app_id=7Ja9qnS6uckhHGA9pL49P5IwMDwt02y8MJhd6ajA'}
            target="_blank"
          />
        </>
      )}
      {active && kycStatus === 'requires-signin' && (
        <>
          <StepParagraph>To continue with onboarding, you need to sign in again with your Securitize iD.</StepParagraph>
          <Button primary largeOnMobile={false} label={`Sign in with Securitize`} href={onboardingData?.kyc?.url} />
        </>
      )}
    </Step>
  )
}

export default KycStep
