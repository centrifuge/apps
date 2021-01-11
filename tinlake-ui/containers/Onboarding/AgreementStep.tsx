import { AgreementsStatus } from '@centrifuge/onboard-api/src/controllers/types'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, CheckBox, Paragraph } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import config, { Pool } from '../../config'
import { OnboardingState } from '../../ducks/onboarding'
import { FormFieldWithoutBorder, Step, StepBody, StepHeader, StepIcon, StepTitle } from './styles'

interface Props {
  activePool: Pool
  tinlake: ITinlake
  active: boolean
  tranche?: 'senior' | 'junior'
  onboarding: OnboardingState
  agreement: AgreementsStatus | undefined
  agreementStatus: 'none' | 'signed' | 'countersigned'
  whitelistStatus: boolean
}

const KycStep: React.FC<Props> = (props: Props) => {
  const [checked, setChecked] = React.useState(false)
  const [error, setError] = React.useState('')

  const router = useRouter()
  const session = 'session' in router.query ? router.query.session : '' // TODO: check this on the API and display message if it has expired

  const awaitingWhitelisting = props.agreementStatus === 'countersigned' && props.whitelistStatus === false

  return (
    <Step>
      <StepHeader>
        {(props.agreementStatus === 'signed' || awaitingWhitelisting) && <StepIcon pending />}
        {!(props.agreementStatus === 'signed' || awaitingWhitelisting) && (
          <StepIcon
            inactive={!props.active}
            checked={props.agreementStatus === 'countersigned' && props.whitelistStatus !== true}
          />
        )}
        <StepTitle inactive={!props.active}>
          {props.agreementStatus === 'none'
            ? 'Sign the Subscription Agreement'
            : props.agreementStatus === 'countersigned' && props.whitelistStatus === true
            ? 'Subscription Agreement signed'
            : 'Subscription Agreement awaiting Issuer signature'}
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
          <Box margin={{ bottom: 'small' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active && props.agreementStatus === 'none' && props.agreement && session && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            You can continue onboarding by signing the {props.agreement.name} for {props.activePool.metadata.name}.
          </Paragraph>
          {!props.onboarding.data?.kyc.isUsaTaxResident && (
            <Box margin={{ left: 'auto', right: 'auto', bottom: 'medium' }}>
              <FormFieldWithoutBorder error={error}>
                <CheckBox
                  checked={checked}
                  label="I accept that this is a US offering which is not solicited nor offered in my home country."
                  onChange={(event) => setChecked(event.target.checked)}
                />
              </FormFieldWithoutBorder>
            </Box>
          )}
          <div>
            <Button
              primary
              label={`Sign ${props.agreement?.name}`}
              href={`${config.onboardAPIHost}pools/${(props.activePool as Pool).addresses.ROOT_CONTRACT}/agreements/${
                props.agreement?.id
              }/redirect?session=${session}`}
              onClick={(event: any) => {
                if (!props.onboarding.data?.kyc.isUsaTaxResident && !checked) {
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
      {props.active && props.agreement && awaitingWhitelisting && (
        <StepBody>
          <Box pad={{ vertical: 'medium' }}>
            The Issuer will counter-sign your {props.agreement.name} for {props.activePool.metadata.name} soon. If KYC
            is verified, you will be ready to invest in this pool upon his signature.
          </Box>
        </StepBody>
      )}
      {/* TODO: or not whitelisted */}
      {!props.active && <StepBody inactive>&nbsp;</StepBody>}
      {props.agreementStatus === 'countersigned' && props.whitelistStatus === true && <StepBody>&nbsp;</StepBody>}
    </Step>
  )
}

export default KycStep
