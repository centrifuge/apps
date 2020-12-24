import { AgreementsStatus } from '@centrifuge/onboard-api/src/controllers/types'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, CheckBox, Paragraph } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useSelector } from 'react-redux'
import config, { Pool } from '../../config'
import { OnboardingState } from '../../ducks/onboarding'
import { Step, StepHeader, StepIcon, StepTitle, StepBody } from './styles'

interface Props {
  activePool: Pool
  tinlake: ITinlake
  tranche?: 'senior' | 'junior'
}

const DefaultTranche = 'senior'

const KycStep: React.FC<Props> = (props: Props) => {
  const onboarding = useSelector<any, OnboardingState>((state) => state.onboarding)
  const kycStatus = onboarding.data?.kyc?.verified ? 'verified' : onboarding.data?.kyc?.created ? 'created' : 'none'
  const agreement = onboarding.data?.agreements.filter(
    (agreement: AgreementsStatus) => agreement.tranche === (props.tranche || DefaultTranche)
  )[0]
  const agreementStatus = agreement?.counterSigned ? 'countersigned' : agreement?.signed ? 'signed' : 'none'

  const [checked, setChecked] = React.useState(false)

  const router = useRouter()
  const session = 'session' in router.query ? router.query.session : '' // TODO: check this on the API and display message if it has expired

  return (
    <Step>
      <StepHeader>
        <StepIcon inactive={kycStatus === 'none' || agreementStatus === 'countersigned'} />
        <StepTitle inactive={kycStatus === 'none' || agreementStatus === 'countersigned'}>
          {agreementStatus === 'none'
            ? 'Sign the Subscription Agreement'
            : agreementStatus === 'countersigned'
            ? 'Subscription Agreement signed'
            : 'Subscription Agreement awaiting counter-signature'}
        </StepTitle>
      </StepHeader>
      {kycStatus !== 'none' && agreementStatus === 'none' && agreement && !session && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '70%' }}>
            To complete the next step of signing the {agreement.name} for {props.activePool?.metadata.name}, you can
            sign in again with your Securitize iD.
          </Paragraph>
          <div>
            <Button primary label={'Sign in with Securitize'} href={onboarding.data?.kyc?.url} fill={false} />
          </div>
          <Box margin={{ bottom: 'medium' }}>&nbsp;</Box>
        </StepBody>
      )}
      {kycStatus !== 'none' && agreementStatus === 'none' && agreement && session && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            You can continue onboarding by signing the {agreement.name} for {props.activePool.metadata.name}.
          </Paragraph>
          <Box margin={{ left: 'auto', right: 'auto', bottom: 'medium' }}>
            <CheckBox
              checked={checked}
              label="I accept that this is a US offering which is not solicited nor offered in my home country."
              onChange={(event) => setChecked(event.target.checked)}
            />
          </Box>
          <div>
            <Button
              primary
              label={`Sign ${agreement?.name}`}
              disabled={!checked}
              href={`${config.onboardAPIHost}pools/${(props.activePool as Pool).addresses.ROOT_CONTRACT}/agreements/${
                agreement?.id
              }/redirect?session=${session}`}
              fill={false}
            />
          </div>
          <Box margin={{ bottom: 'medium' }}>&nbsp;</Box>
        </StepBody>
      )}
      {kycStatus !== 'none' && agreementStatus === 'signed' && agreement && (
        <StepBody>
          <Box pad={{ vertical: 'medium' }}>
            The issuer needs to counter-sign the {agreement.name} of {props.activePool.metadata.name}.
          </Box>
        </StepBody>
      )}
      {(kycStatus === 'none' || agreementStatus === 'countersigned') && <StepBody inactive>&nbsp;</StepBody>}
    </Step>
  )
}

export default KycStep
