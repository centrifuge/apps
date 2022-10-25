import { Modal } from '@centrifuge/axis-modal'
import { Anchor, Box, Button, Paragraph } from 'grommet'
import { StatusInfo as StatusInfoIcon } from 'grommet-icons'
import Link from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'
import config, { Pool } from '../../config'
import { AddressStatus, AgreementsStatus } from '../../types'
import { Checkbox } from '../Checkbox'
import { Step, StepProps } from './Step'
import { StepParagraph } from './StepParagraph'
import { LegalCopy } from './styles'

interface Props {
  state: StepProps['state']
  activePool?: Pool
  onboardingData: AddressStatus | undefined
  agreement: AgreementsStatus | undefined
  agreementStatus: 'none' | 'signed' | 'countersigned' | 'declined' | 'voided'
  whitelistStatus: boolean
}

const AgreementStep: React.FC<Props> = ({
  state,
  activePool,
  onboardingData,
  agreement,
  agreementStatus,
  whitelistStatus,
}) => {
  const active = state === 'active'
  const [checked, setChecked] = React.useState(false)

  const router = useRouter()
  const session = 'session' in router.query ? router.query.session : '' // TODO: check this on the API and display message if it has expired

  const poolName = activePool?.metadata.shortName || activePool?.metadata.name

  const [nonSolicitationModalIsOpen, setNonSolicitationModalIsOpen] = React.useState(false)

  const openNonSolicitationModal = () => {
    setNonSolicitationModalIsOpen(true)
  }
  const closeNonSolicitationModal = () => {
    setNonSolicitationModalIsOpen(false)
  }

  const isRestricted = onboardingData?.restrictedGlobal || onboardingData?.restrictedPool
  const isAgreementStatusNegative = ['none', 'declined', 'voided'].includes(agreementStatus)

  return (
    <>
      <Step
        state={state}
        title="Sign Subscription Agreement"
        subtitle={
          agreementStatus === 'signed'
            ? 'Awaiting Issuer signature'
            : agreementStatus === 'voided'
            ? 'Agreement expired'
            : agreementStatus === 'declined'
            ? 'Agreement declined'
            : agreementStatus === 'countersigned'
            ? 'Signed'
            : undefined
        }
      >
        {active && !isRestricted && isAgreementStatusNegative && agreement && !session && (
          <>
            <StepParagraph>
              {agreementStatus === 'declined'
                ? `The issuer has declined signing your subscription agreement. This may be due to missing or incorrect information provided in the subscription agreement. Please check your email inbox for further feedback and instructions. To continue, sign in again with Securitize, then complete and sign a new subscription agreement to finalize your onboarding process.`
                : agreementStatus === 'voided'
                ? `The agreement has expired. To continue, sign in again with Securitize, then complete and sign a new subscription agreement to finalize your onboarding process.`
                : `Start the final step of signing the ${agreement.name} for ${poolName} by signing in with your
              Securitize iD.`}
            </StepParagraph>
            <Button primary label={'Sign in with Securitize'} href={onboardingData?.kyc?.url} fill={false} />
          </>
        )}
        {active && isRestricted && (
          <>
            {onboardingData?.restrictedGlobal && (
              <StepParagraph icon="alert">
                You are located in or are a resident of a country that is blocked from investment in Tinlake for
                regulatory reasons. Please find more information on regulatory restrictions{' '}
                <Anchor
                  href="https://centrifuge.hackmd.io/@rQf339bfSHi_a3rLcEuoaQ/BkdzEs5WO"
                  target="_blank"
                  style={{ display: 'inline' }}
                  label="here"
                />
                .
              </StepParagraph>
            )}
            {!onboardingData?.restrictedGlobal && (
              <>
                <StepParagraph icon="alert">
                  You are located in or are a resident of a country that has been blocked by the issuer for regulatory
                  reasons, e.g. missing tax treaties or sanctions. Find more information on regulatory restrictions{' '}
                  <Anchor
                    href="https://centrifuge.hackmd.io/@rQf339bfSHi_a3rLcEuoaQ/BkdzEs5WO"
                    target="_blank"
                    style={{ display: 'inline' }}
                    label="here"
                  />
                  .
                </StepParagraph>
                <Link href="/">
                  <Button label="Explore other pools" primary />
                </Link>
              </>
            )}
          </>
        )}
        {active && !isRestricted && isAgreementStatusNegative && agreement && session && (
          <>
            <StepParagraph>
              {agreementStatus === 'declined'
                ? `The issuer has declined signing your subscription agreement. This may be due to missing or incorrect information provided in the subscription agreement. Please check your email inbox for further feedback and instructions. Please click the button below to complete a new subscription agreement to finalize your onboarding process.`
                : agreementStatus === 'voided'
                ? `The agreement has expired. Please click the button below to complete a new subscription agreement to finalize your onboarding process.`
                : `Finalize onboarding by signing the ${
                    agreement.name
                  } for ${poolName}. Note that the minimum investment
            amount for this pool is 5000 ${activePool?.metadata.currencySymbol || 'DAI'}.`}
              {activePool?.metadata.slug === 'rwa-market' &&
                ' US investors are excluded from participating in this market.'}
            </StepParagraph>
            {onboardingData?.showNonSolicitationNotice && (
              <Checkbox
                checked={checked}
                label={
                  <>
                    I confirm that I am requesting the subscription agreement and further investment information without
                    having being solicited or approached, directly or indirectly by the issuer of{' '}
                    {activePool?.metadata.shortName || activePool?.metadata.name} or any affiliate.&nbsp;
                    <Anchor
                      onClick={(event: any) => {
                        openNonSolicitationModal()
                        event.preventDefault()
                      }}
                      style={{ display: 'inline' }}
                      label="View more"
                    />
                    .
                  </>
                }
                onChange={(event) => setChecked(event.target.checked)}
              />
            )}
            <Button
              primary
              label={['voided', 'declined'].includes(agreementStatus) ? 'Sign new agreement' : 'Sign agreement'}
              href={`${config.onboardAPIHost}pools/${(activePool as Pool).addresses.ROOT_CONTRACT}/agreements/${
                agreement?.provider
              }/${agreement?.providerTemplateId}/redirect?session=${session}`}
              disabled={onboardingData?.showNonSolicitationNotice && !checked}
            />
          </>
        )}
        {active && !isRestricted && agreement && agreementStatus === 'signed' && (
          <>
            <StepParagraph icon="clock">
              The Issuer will counter-sign your {agreement.name} for {poolName} soon. If KYC is verified, you will be
              ready to invest in this pool upon their signature.
            </StepParagraph>
          </>
        )}
        {active && !isRestricted && agreement && agreementStatus === 'countersigned' && whitelistStatus === false && (
          <StepParagraph icon="clock">
            Your address is currently being whitelisted. This should only take a couple of minutes. Please contact{' '}
            <Anchor href="mailto:support@centrifuge.io" style={{ display: 'inline' }} label="support@centrifuge.io" />{' '}
            if you can’t invest after one hour.
          </StepParagraph>
        )}
      </Step>
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
            about the issuer of {activePool?.metadata.shortName || activePool?.metadata.name} (Executive Summary,
            Subscription Documents, Contacts and other offering materials), tick the box and continue. By doing so, you
            are confirming that you are requesting this information without having been being solicited or approached,
            directly or indirectly by the issuer of {activePool?.metadata.shortName || activePool?.metadata.name} or any
            affiliate of or other person acting as agent or otherwise on behalf of the issuer of{' '}
            {activePool?.metadata.shortName || activePool?.metadata.name} including but not limited to Centrifuge.
          </Paragraph>
        </LegalCopy>

        <Box direction="row" justify="end">
          <Box basis={'1/5'}>
            <Button primary onClick={closeNonSolicitationModal} label="OK" fill={true} />
          </Box>
        </Box>
      </Modal>
    </>
  )
}

export default AgreementStep
