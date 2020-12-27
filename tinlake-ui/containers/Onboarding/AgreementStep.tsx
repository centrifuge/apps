import { AgreementsStatus } from '@centrifuge/onboard-api/src/controllers/types'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, CheckBox, Paragraph } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import config, { Pool } from '../../config'
import { OnboardingState } from '../../ducks/onboarding'
import { Step, StepHeader, StepIcon, StepTitle, StepBody, FormFieldWithoutBorder } from './styles'

interface Props {
  activePool: Pool
  tinlake: ITinlake
  active: boolean
  tranche?: 'senior' | 'junior'
  onboarding: OnboardingState
  agreement: AgreementsStatus | undefined
  agreementStatus: 'none' | 'signed' | 'countersigned'
}

const KycStep: React.FC<Props> = (props: Props) => {
  const [checked, setChecked] = React.useState(false)
  const [error, setError] = React.useState('')

  const router = useRouter()
  const session = 'session' in router.query ? router.query.session : '' // TODO: check this on the API and display message if it has expired

  return (
    <Step>
      <StepHeader>
        <StepIcon inactive={!props.active} checked={props.agreementStatus === 'countersigned'} />
        <StepTitle inactive={!props.active}>
          {props.agreementStatus === 'none'
            ? 'Sign the Subscription Agreement'
            : props.agreementStatus === 'countersigned'
            ? 'Subscription Agreement signed'
            : 'Subscription Agreement awaiting counter-signature'}
        </StepTitle>
      </StepHeader>
      {props.active && props.agreementStatus === 'none' && props.agreement && !session && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '70%' }}>
            To complete the next step of signing the {props.agreement.name} for {props.activePool?.metadata.name}, you
            can sign in again with your Securitize iD.
          </Paragraph>
          <div>
            <Button primary label={'Sign in with Securitize'} href={props.onboarding.data?.kyc?.url} fill={false} />
          </div>
          <Box margin={{ bottom: 'medium' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active && props.agreementStatus === 'none' && props.agreement && session && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            You can continue onboarding by signing the {props.agreement.name} for {props.activePool.metadata.name}.
          </Paragraph>
          <Box margin={{ left: 'auto', right: 'auto', bottom: 'medium' }}>
            <FormFieldWithoutBorder error={error}>
              <CheckBox
                checked={checked}
                label="I accept that this is a US offering which is not solicited nor offered in my home country."
                onChange={(event) => setChecked(event.target.checked)}
              />
            </FormFieldWithoutBorder>
          </Box>
          <div>
            <Button
              primary
              label={`Sign ${props.agreement?.name}`}
              href={`${config.onboardAPIHost}pools/${(props.activePool as Pool).addresses.ROOT_CONTRACT}/agreements/${
                props.agreement?.id
              }/redirect?session=${session}`}
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
      {props.active && props.agreementStatus === 'signed' && props.agreement && (
        <StepBody>
          <Box pad={{ vertical: 'medium' }}>
            The issuer needs to counter-sign the {props.agreement.name} of {props.activePool.metadata.name}.
          </Box>
        </StepBody>
      )}
      {!props.active && <StepBody inactive>&nbsp;</StepBody>}
    </Step>
  )
}

export default KycStep
