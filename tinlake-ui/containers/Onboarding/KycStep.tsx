import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, CheckBox, Paragraph } from 'grommet'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Pool } from '../../config'
import { OnboardingState } from '../../ducks/onboarding'
import { Step, StepHeader, StepIcon, StepTitle, StepBody } from './styles'

interface Props {
  activePool: Pool
  tinlake: ITinlake
}

const KycStep: React.FC<Props> = (props: Props) => {
  const onboarding = useSelector<any, OnboardingState>((state) => state.onboarding)
  const kycStatus = onboarding.data?.kyc?.verified ? 'verified' : onboarding.data?.kyc?.created ? 'created' : 'none'

  const [checked, setChecked] = React.useState(false)

  return (
    <Step>
      <StepHeader>
        <StepIcon inactive={kycStatus !== 'none'} />
        <StepTitle inactive={kycStatus !== 'none'}>
          {kycStatus === 'none'
            ? 'Verify KYC information'
            : kycStatus === 'verified'
            ? 'KYC status: verified'
            : 'KYC status: awaiting verification'}
        </StepTitle>
      </StepHeader>
      {kycStatus === 'none' && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            Tinlake has integrated Securitize.io’s automated KYC process for investor onboarding. This is a one time
            process to become an eligible investor for all Tinlake pools. Once Securitize has verified your
            documentation you will be provided with your “Securitize iD” which makes you eligible to invest in all open
            Tinlake pools. To invest in an individual pool you will be asked to sign the subscription agreement with the
            pool’s issuer also provided through the Securitize dashboard and signed through DocuSign. Once the issuer
            has countersigned, you are ready to invest.
          </Paragraph>
          <Box margin={{ left: 'auto', right: 'auto', bottom: 'medium' }}>
            <CheckBox
              checked={checked}
              label="I accept the data privacy policy and that data is shared with Centrifuge and the issuer."
              onChange={(event) => setChecked(event.target.checked)}
            />
          </Box>
          <div>
            <Button primary label={`Start KYC now`} href={onboarding.data?.kyc?.url} fill={false} />
          </div>
          <Box margin={{ bottom: 'medium' }}>&nbsp;</Box>
        </StepBody>
      )}
      {kycStatus !== 'none' && <StepBody inactive>&nbsp;</StepBody>}
    </Step>
  )
}

export default KycStep
