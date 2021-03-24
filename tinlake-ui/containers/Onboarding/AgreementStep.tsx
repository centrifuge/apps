import { Modal } from '@centrifuge/axis-modal'
import { AgreementsStatus } from '@centrifuge/onboarding-api/src/controllers/types'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Anchor, Box, Button, CheckBox, Paragraph } from 'grommet'
import { StatusInfo as StatusInfoIcon } from 'grommet-icons'
import Link from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'
import config, { Pool } from '../../config'
import { OnboardingState } from '../../ducks/onboarding'
import { FormFieldWithoutBorder, LegalCopy, Step, StepBody, StepHeader, StepIcon, StepTitle } from './styles'

interface Props {
  activePool?: Pool
  tinlake: ITinlake
  active: boolean
  tranche?: 'senior' | 'junior'
  onboarding: OnboardingState
  agreement: AgreementsStatus | undefined
  agreementStatus: 'none' | 'signed' | 'countersigned'
  whitelistStatus: boolean
}

const AgreementStep: React.FC<Props> = (props: Props) => {
  const [checked, setChecked] = React.useState(false)
  const [error, setError] = React.useState('')

  const router = useRouter()
  const session = 'session' in router.query ? router.query.session : '' // TODO: check this on the API and display message if it has expired

  const poolName = props.activePool?.metadata.shortName || props.activePool?.metadata.name

  const [nonSolicitationModalIsOpen, setNonSolicitationModalIsOpen] = React.useState(false)

  const openNonSolicitationModal = () => {
    setNonSolicitationModalIsOpen(true)
  }
  const closeNonSolicitationModal = () => {
    setNonSolicitationModalIsOpen(false)
  }

  const isRestricted = props.onboarding.data?.restrictedGlobal || props.onboarding.data?.restrictedPool

  return (
    <Step>
      <StepHeader>
        {props.agreementStatus === 'signed' && <StepIcon pending />}
        {props.agreementStatus !== 'signed' && (
          <StepIcon
            inactive={!props.active}
            checked={props.agreementStatus === 'countersigned'}
            failed={isRestricted}
          />
        )}
        <StepTitle inactive={!props.active}>
          {props.agreementStatus === 'none'
            ? `Sign the Subscription Agreement`
            : props.agreementStatus === 'countersigned'
            ? `${props.agreement?.name} signed`
            : `${props.agreement?.name} status: awaiting Issuer signature`}
        </StepTitle>
      </StepHeader>
      {props.active && !isRestricted && props.agreementStatus === 'none' && props.agreement && !session && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            Start the final step of signing the {props.agreement.name} for {poolName} by signing in with your Securitize
            iD.
          </Paragraph>
          <div>
            <Button primary label={'Sign in with Securitize'} href={props.onboarding.data?.kyc?.url} fill={false} />
          </div>
          <Box margin={{ bottom: 'small' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active && isRestricted && (
        <StepBody>
          {props.onboarding.data?.restrictedGlobal && (
            <Paragraph>
              You are located in or are a resident of a country that is blocked from investment in Tinlake for
              regulatory reasons. Please find more information on regulatory restrictions{' '}
              <a href="https://centrifuge.hackmd.io/@rQf339bfSHi_a3rLcEuoaQ/BkdzEs5WO" target="_blank">
                here
              </a>
              .
            </Paragraph>
          )}
          {!props.onboarding.data?.restrictedGlobal && (
            <>
              <Paragraph>
                You are located in or are a resident of a country that has been blocked by the issuer for regulatory
                reasons, e.g. missing tax treaties or sanctions. Find more information on regulatory restrictions{' '}
                <a href="https://centrifuge.hackmd.io/@rQf339bfSHi_a3rLcEuoaQ/BkdzEs5WO" target="_blank">
                  here
                </a>
                .
              </Paragraph>
              <Link href="/">
                <Button label="Explore other pools" primary />
              </Link>
            </>
          )}
          <Box margin={{ bottom: 'small' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active && !isRestricted && props.agreementStatus === 'none' && props.agreement && session && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            Finalize onboarding by signing the {props.agreement.name} for {poolName}. Note that the minimum investment
            amount for this pool is 5.000 {props.activePool?.metadata.currencySymbol || 'DAI'}.
          </Paragraph>
          {props.onboarding.data?.showNonSolicitationNotice && (
            <Box margin={{ right: 'auto', bottom: 'medium' }}>
              <FormFieldWithoutBorder error={error}>
                <CheckBox
                  checked={checked}
                  label={
                    <div style={{ lineHeight: '24px' }}>
                      I confirm that I am requesting the subscription agreement and further investment information
                      without having being solicited or approached, directly or indirectly by the issuer of{' '}
                      {props.activePool?.metadata.shortName || props.activePool?.metadata.name} or any affiliate.&nbsp;
                      <Anchor
                        onClick={(event: any) => {
                          openNonSolicitationModal()
                          event.preventDefault()
                        }}
                        style={{ display: 'inline' }}
                        label="View more"
                      />
                      .
                    </div>
                  }
                  onChange={(event) => setChecked(event.target.checked)}
                />
              </FormFieldWithoutBorder>
            </Box>
          )}
          <div>
            <Button
              primary
              label={`Sign Subscription Agreement`}
              href={`${config.onboardAPIHost}pools/${(props.activePool as Pool).addresses.ROOT_CONTRACT}/agreements/${
                props.agreement?.provider
              }/${props.agreement?.providerTemplateId}/redirect?session=${session}`}
              onClick={(event: any) => {
                if (props.onboarding.data?.showNonSolicitationNotice && !checked) {
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
      {props.active && !isRestricted && props.agreement && props.agreementStatus === 'signed' && (
        <StepBody>
          <Box pad={{ vertical: 'medium' }}>
            The Issuer will counter-sign your {props.agreement.name} for {poolName} soon. If KYC is verified, you will
            be ready to invest in this pool upon their signature.
          </Box>
        </StepBody>
      )}
      {!props.active && <StepBody inactive>&nbsp;</StepBody>}
      {props.whitelistStatus === true && <StepBody>&nbsp;</StepBody>}

      <Modal
        opened={nonSolicitationModalIsOpen}
        title={
          'Confirmation that your are requesting the subscription agreement and further investment information without having being solicited or approached by the issuer.'
        }
        headingProps={{ style: { maxWidth: '100%', display: 'flex' } }}
        titleIcon={<StatusInfoIcon />}
        onClose={closeNonSolicitationModal}
      >
        <LegalCopy>
          <Paragraph margin={{ top: 'medium' }}>
            You are located in or are a resident of a country where the cross-border marketing of securities or
            investments is restricted. However, you can still register. If you are still interested in more information
            about the issuer of {props.activePool?.metadata.shortName || props.activePool?.metadata.name} (Executive
            Summary, Subscription Documents, Contacts and other offering materials), tick the box and continue. By doing
            so, you are confirming that you are requesting this information without having been being solicited or
            approached, directly or indirectly by the issuer of{' '}
            {props.activePool?.metadata.shortName || props.activePool?.metadata.name} or any affiliate of or other
            person acting as agent or otherwise on behalf of the issuer of{' '}
            {props.activePool?.metadata.shortName || props.activePool?.metadata.name} including but not limited to
            Centrifuge.
          </Paragraph>
        </LegalCopy>

        <Box direction="row" justify="end">
          <Box basis={'1/5'}>
            <Button primary onClick={closeNonSolicitationModal} label="OK" fill={true} />
          </Box>
        </Box>
      </Modal>
    </Step>
  )
}

export default AgreementStep
