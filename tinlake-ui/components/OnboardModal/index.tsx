import { Spinner } from '@centrifuge/axis-spinner'
import { Box, Button, Heading, Paragraph } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Pool, UpcomingPool } from '../../config'
import { ensureAuthed } from '../../ducks/auth'
import { PoolsState } from '../../ducks/pools'
import { PoolLink } from '../PoolLink'
import { FormModal, InvestmentSteps } from './styles'
import { loadOnboardingStatus, OnboardingState } from '../../ducks/onboarding'

interface Props {
  pool: Pool | UpcomingPool
  card?: boolean
}

const OnboardModal: React.FC<Props> = (props: Props) => {
  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const onOpen = () => setModalIsOpen(true)
  const onClose = () => setModalIsOpen(false)

  const router = useRouter()
  const dispatch = useDispatch()

  const onboarding = useSelector<any, OnboardingState>((state) => state.onboarding)
  const pools = useSelector<any, PoolsState>((state) => state.pools)

  const address = useSelector<any, string | null>((state) => state.auth.address)

  const connect = () => {
    dispatch(ensureAuthed())
    setModalIsOpen(false) // Hide this modal and focus on the modal for connecting your wallet
  }

  const [addressIsLoading, setAddressIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (address) {
      setAddressIsLoading(false)
      dispatch(loadOnboardingStatus(props.pool, router.query?.session))
    }

    if (address && !modalIsOpen && 'onb' in router.query && router.query.onb === '1') setModalIsOpen(true)
  }, [address])

  const AddressLoadingDelay = 3000 // milliseconds

  const kycStatus = onboarding.data?.kyc.verified ? 'verified' : onboarding.data?.kyc.created ? 'created' : 'none'
  const agreementStatus = onboarding.data?.agreements[0]?.counterSigned
    ? 'countersigned'
    : onboarding.data?.agreements[0]?.signed
    ? 'signed'
    : 'none'

  React.useEffect(() => {
    setTimeout(() => {
      setAddressIsLoading(false)
    }, AddressLoadingDelay)
  }, [])

  React.useEffect(() => {
    if (!modalIsOpen && 'onb' in router.query && router.query.onb === '1') {
      setModalIsOpen(true)
    }
  }, [router.query])

  React.useEffect(() => {
    dispatch(loadOnboardingStatus(props.pool, router.query?.session))
  }, [pools])

  return (
    <>
      {!props.card && kycStatus !== 'none' && (
        <Box margin={{ left: 'auto' }}>
          <PoolLink href={'/investments'}>
            <Button primary label="Invest" fill={false} />
          </PoolLink>
        </Box>
      )}

      {!props.card && kycStatus === 'none' && (
        <Box margin={{ left: 'auto' }}>
          <Button primary label="Get started" fill={false} onClick={onOpen} />
        </Box>
      )}

      {props.card && kycStatus === 'none' && (
        <>
          <Heading level="6" margin={{ bottom: 'xsmall' }}>
            Interested in investing?
          </Heading>
          If you want to learn more get started with your onboarding process.
          <Box justify="end" margin={{ top: 'small' }}>
            <Button primary label="Get started" fill={false} onClick={onOpen} />
          </Box>
        </>
      )}

      {props.card && kycStatus !== 'none' && agreementStatus === 'none' && (
        <>
          <Heading level="6" margin={{ bottom: 'xsmall' }}>
            Sign up for this pool.
          </Heading>
          {kycStatus === 'created' && (
            <>
              Your KYC status is pending, you can already continue onboarding as an investor by signing the Subscription
              Agreement for DROP tokens of {props.pool.metadata.name}.
            </>
          )}
          {kycStatus === 'verified' && (
            <>
              You can continue onboarding as an investor by signing the Subscription Agreement for DROP tokens of{' '}
              {props.pool.metadata.name}.
            </>
          )}
          <Box direction="row" justify="end" margin={{ top: 'small' }}>
            <div>
              <Button primary label="Sign Subscription Agreement" fill={false} onClick={onOpen} />
            </div>
          </Box>
        </>
      )}

      {props.card && kycStatus === 'created' && agreementStatus === 'countersigned' && (
        <>
          <Heading level="6" margin={{ bottom: 'xsmall' }}>
            Awaiting verification
          </Heading>
          Your KYC status is pending.
        </>
      )}

      {props.card && agreementStatus === 'signed' && (
        <>
          <Heading level="6" margin={{ bottom: 'xsmall' }}>
            Awaiting counter-signature
          </Heading>
          The issuer needs to counter-sign the Subscription Agreement.
        </>
      )}

      {props.card && kycStatus === 'verified' && agreementStatus === 'countersigned' && (
        <>
          <Heading level="6" margin={{ bottom: 'xsmall' }}>
            Awaiting whitelisting
          </Heading>
          You have completed all steps required for investing in this pool and we are currently processing your request
          and whitelisting you as an investor.
        </>
      )}

      <FormModal
        opened={modalIsOpen}
        title={
          kycStatus === 'none'
            ? 'First time investor? Start your KYC process now.'
            : 'Continue onboarding as an investor'
        }
        onClose={onClose}
        style={{ width: '800px' }}
      >
        {addressIsLoading && <Spinner height={'300px'} message={'Loading...'} />}

        {!addressIsLoading && (
          <Box style={{ textAlign: 'center' }}>
            {!address && (
              <Box flex={true} justify="between">
                <Paragraph>Please connect with the wallet you want to use for investment.</Paragraph>
                <div>
                  <Button primary label={`Connect`} onClick={connect} fill={false} />
                </div>
              </Box>
            )}

            {kycStatus === 'none' && (
              <>
                <Paragraph
                  margin={{ top: 'small', bottom: 'medium', left: 'auto', right: 'auto' }}
                  style={{ textAlign: 'center', width: '100%' }}
                >
                  Tinlake has integrated Securitize.io’s automated KYC process for investor onboarding. This is a one
                  time process to become an eligible investor for all Tinlake pools. Once Securitize has verified your
                  documentation you will be provided with your “Securitize iD” which makes you eligible to invest in all
                  open Tinlake pools. To invest in an individual pool you will be asked to sign the subscription
                  agreement with the pool’s issuer also provided through the Securitize dashboard and signed through
                  DocuSign. Once the issuer has countersigned, you are ready to invest.
                </Paragraph>
                {/* <InvestmentSteps src={'/static/onboarding/1.svg'} alt="Investment steps" /> */}
                <div>
                  <Button primary label={`Start KYC now`} href={onboarding.data?.kyc?.url} fill={false} />
                </div>
              </>
            )}

            {agreementStatus === 'none' && onboarding.data?.agreements[0]?.id && (
              <>
                <Paragraph
                  margin={{ top: 'small', bottom: 'medium', left: 'auto', right: 'auto' }}
                  style={{ textAlign: 'center', width: '50%' }}
                >
                  You can continue onboarding by signing the Subscription Agreement for {props.pool?.metadata.name}.
                </Paragraph>
                {/* <InvestmentSteps src={'/static/onboarding/2.svg'} alt="Investment steps" /> */}
                <div>
                  <Button
                    primary
                    label={`Sign Subscription Agreement`}
                    href={onboarding.agreementLinks[onboarding.data?.agreements[0]?.id]}
                    fill={false}
                  />
                </div>
              </>
            )}

            {agreementStatus === 'none' && !onboarding.data?.agreements[0]?.id && (
              <>
                <Paragraph
                  margin={{ top: 'small', bottom: 'medium', left: 'auto', right: 'auto' }}
                  style={{ textAlign: 'center', width: '50%' }}
                >
                  To complete the next step of signing the Subscription Agreement, you can sign in again with your
                  Securitize iD.
                </Paragraph>
                {/* <InvestmentSteps src={'/static/onboarding/2.svg'} alt="Investment steps" /> */}
                <div>
                  <Button primary label={`Sign in with Securitize`} href={onboarding.data?.kyc?.url} fill={false} />
                </div>
              </>
            )}

            {kycStatus !== 'verified' && agreementStatus === 'signed' && (
              <>
                <Paragraph
                  margin={{ top: 'small', bottom: 'medium', left: 'auto', right: 'auto' }}
                  style={{ textAlign: 'center', width: '50%' }}
                >
                  Your KYC status is pending and you have signed the Subscription Agreement, which is pending a
                  signature from the issuer of {props.pool?.metadata.name}.
                </Paragraph>
                {/* <InvestmentSteps src={'/static/onboarding/3.svg'} alt="Investment steps" /> */}
                <div>
                  <Button primary label={`OK`} onClick={close} fill={false} />
                </div>
              </>
            )}

            {kycStatus !== 'verified' && agreementStatus === 'countersigned' && (
              <>
                <Paragraph
                  margin={{ top: 'small', bottom: 'medium', left: 'auto', right: 'auto' }}
                  style={{ textAlign: 'center', width: '50%' }}
                >
                  The Subscription Agreement has been signed by you and the issuer of {props.pool?.metadata.name}. Your
                  KYC status is still pending.
                </Paragraph>
                {/* <InvestmentSteps src={'/static/onboarding/3.svg'} alt="Investment steps" /> */}
                <div>
                  <Button primary label={`OK`} onClick={close} fill={false} />
                </div>
              </>
            )}

            {kycStatus === 'verified' && agreementStatus === 'countersigned' && (
              <>
                <Paragraph
                  margin={{ top: 'small', bottom: 'medium', left: 'auto', right: 'auto' }}
                  style={{ textAlign: 'center', width: '80%' }}
                >
                  You have completed onboarding successfuly for {props.pool?.metadata.name} and can now invest.
                </Paragraph>
                <div>
                  <PoolLink href={'/investments'}>
                    <Button primary label="Invest" fill={false} />
                  </PoolLink>
                </div>
              </>
            )}
          </Box>
        )}
      </FormModal>
    </>
  )
}

export default OnboardModal
