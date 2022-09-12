import { AddressStatus, KycStatusLabel } from '@centrifuge/onboarding-api/src/controllers/types'
import { Anchor } from 'grommet'
import * as React from 'react'
import config from '../../config'
import { Button } from '../Button'
import { Step, StepProps } from './Step'
import { StepParagraph } from './StepParagraph'

interface Props {
  state: StepProps['state']
  onboardingData: Pick<AddressStatus, 'kyc'> | undefined
  kycStatus: KycStatusLabel | 'requires-signin' | undefined
  accreditationStatus: boolean
  agreementStatus?: 'none' | 'signed' | 'countersigned' | 'declined' | 'voided'
}

// TODO: Redirect to onboard API URL that isn't pool dependant
const placeholderPoolId = '0x560Ac248ce28972083B718778EEb0dbC2DE55740'
const onboardURL = `${config.onboardAPIHost}pools/${placeholderPoolId}/info-redirect`

const KycStep: React.FC<Props> = ({ state, onboardingData, kycStatus, accreditationStatus, agreementStatus }) => {
  const active = state === 'active'

  return (
    <Step
      state={state === 'done' && kycStatus === 'processing' ? 'todo' : state}
      title="Verify KYC"
      subtitle={
        state === 'done' && kycStatus === 'processing'
          ? 'In progress'
          : kycStatus === 'verified' && !accreditationStatus
          ? 'Submit accreditation'
          : kycStatus === 'expired'
          ? 'Expired'
          : kycStatus === 'rejected'
          ? 'Rejected'
          : undefined
      }
      icon={kycStatus === 'processing' ? 'clock' : undefined}
    >
      {active &&
        kycStatus === 'processing' &&
        (agreementStatus === 'countersigned' ? (
          <>
            <StepParagraph icon="clock">
              Your KYC is still in review. Check your profile for more details.
            </StepParagraph>
            <Button primary label="Check Securitize profile" href={onboardURL} target="_blank" />
          </>
        ) : (
          <StepParagraph icon="clock">Submitted KYC is being verified</StepParagraph>
        ))}
      {active && kycStatus && ['none', 'updates-required', 'expired'].includes(kycStatus) && (
        <>
          <StepParagraph>
            {kycStatus === 'updates-required'
              ? 'Your submitted KYC requires an update.'
              : 'Submit your KYC information through Securitize for verification. This is a one time process to become an eligible investor for all Tinlake pools.'}
          </StepParagraph>
          <Button
            primary
            label={kycStatus === 'none' ? 'Submit KYC on Securitize' : 'Complete on Securitize'}
            href={onboardURL}
            target="_blank"
          />
        </>
      )}
      {active && kycStatus && kycStatus === 'rejected' && (
        <StepParagraph icon={kycStatus === 'rejected' ? 'alert' : undefined}>
          Your KYC application was declined. Please reach out to{' '}
          <Anchor href="mailto:support@centrifuge.io" style={{ display: 'inline' }} label="support@centrifuge.io" /> for
          help.
        </StepParagraph>
      )}
      {active && kycStatus === 'verified' && !accreditationStatus && (
        <>
          <StepParagraph>
            Your KYC submission has been verified, but you still need to finish accreditation as a US tax resident. To
            complete this step, please submit your accreditation information on Securitize. If you experience any
            issues, please contact{' '}
            <Anchor href="mailto:support@centrifuge.io" style={{ display: 'inline' }} label="support@centrifuge.io" />.
          </StepParagraph>
          <Button
            primary
            largeOnMobile={false}
            label="Submit accreditation on Securitize"
            href={'https://id.securitize.io/#/profile/accreditation'}
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
