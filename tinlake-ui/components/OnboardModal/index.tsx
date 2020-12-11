import { Anchor, Box, Button, Paragraph } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import config, { Pool, UpcomingPool } from '../../config'
import { AuthState, ensureAuthed } from '../../ducks/auth'
import { PoolData as PoolDataV3, PoolState } from '../../ducks/pool'
import { PoolsState } from '../../ducks/pools'
import { PoolLink } from '../PoolLink'
import { FormModal, InvestmentSteps } from './styles'
import { AddressStatus } from '@centrifuge/onboard-api/src/controllers/types'
import { Spinner } from '@centrifuge/axis-spinner'

interface Props {
  anchor?: React.ReactNode
  pool: Pool | UpcomingPool
}

const OnboardModal: React.FC<Props> = (props: Props) => {
  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const onOpen = () => setModalIsOpen(true)
  const onClose = () => setModalIsOpen(false)

  const router = useRouter()
  const dispatch = useDispatch()

  const authState = useSelector<any, AuthState>((state) => state.auth)
  const pools = useSelector<any, PoolsState>((state) => state.pools)
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolDataV3 | undefined

  const [status, setStatus] = React.useState<AddressStatus | undefined>(undefined)
  const [agreementLink, setAgreementLink] = React.useState<string | undefined>(undefined)

  const address = useSelector<any, string | null>((state) => state.auth.address)

  const connect = () => {
    dispatch(ensureAuthed())
    setModalIsOpen(false) // Hide this modal and focus on the modal for connecting your wallet
  }

  const getOnboardingStatus = async () => {
    if (address && props.pool && 'addresses' in props.pool) {
      try {
        const req = await fetch(
          `${config.onboardAPIHost}pools/${props.pool?.addresses?.ROOT_CONTRACT}/addresses/${address}`
        )
        const body = await req.json()
        setStatus(body)

        if (body.agreements.length > 0 && 'session' in router.query) {
          const req = await fetch(
            `${config.onboardAPIHost}pools/${props.pool?.addresses?.ROOT_CONTRACT}/agreements/${body.agreements[0].id}/link?session=${router.query.session}`
          )
          const link = await req.text()
          setAgreementLink(link)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  const [addressIsLoading, setAddressIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (address) {
      setAddressIsLoading(false)
      getOnboardingStatus()
    }
    if (address && !modalIsOpen && 'onb' in router.query && router.query.onb === '1') setModalIsOpen(true)
  }, [address])

  const AddressLoadingDelay = 3000 // milliseconds

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
    getOnboardingStatus()
  }, [pools])

  React.useEffect(() => {
    console.log(authState.authState)
  }, [authState.authState])

  return (
    <>
      {(poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist) && (
        <Box margin={{ left: 'auto' }}>
          <PoolLink href={'/investments'}>
            <Button primary label="Invest" fill={false} />
          </PoolLink>
        </Box>
      )}
      {!(poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist) && (
        <Box margin={{ left: 'auto' }}>
          <Button primary label="Get started" fill={false} onClick={onOpen} />
        </Box>
      )}

      <FormModal
        opened={modalIsOpen}
        title={
          !status?.kyc?.created
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

            {status?.kyc?.url && !status.kyc?.created && (
              <>
                <Paragraph
                  margin={{ top: 'small', bottom: 'small', left: 'auto', right: 'auto' }}
                  style={{ textAlign: 'center', width: '100%' }}
                >
                  Tinlake has integrated Securitize.io’s automated KYC process for investor onboarding. This is a one
                  time process to become an eligible investor for all Tinlake pools. Once Securitize has verified your
                  documentation you will be provided with your “Securitize iD” which makes you eligible to invest in all
                  open Tinlake pools. To invest in an individual pool you will be asked to sign the subscription
                  agreement with the pool’s issuer also provided through the Securitize dashboard and signed through
                  DocuSign. Once the issuer has countersigned, you are ready to invest.
                </Paragraph>
                <InvestmentSteps src={'/static/onboarding/1.svg'} alt="Investment steps" />
                <div>
                  <Button primary label={`Start KYC now`} href={status.kyc?.url} fill={false} />
                </div>
              </>
            )}

            {status?.kyc?.url &&
              status.kyc?.created &&
              !status.kyc?.verified &&
              !status.agreements[0]?.signed &&
              agreementLink && (
                <>
                  <Paragraph
                    margin={{ top: 'small', bottom: 'small', left: 'auto', right: 'auto' }}
                    style={{ textAlign: 'center', width: '80%' }}
                  >
                    Your KYC status is pending, you can already continue by signing the Subscription Agreement for{' '}
                    {props.pool?.metadata.name}.
                  </Paragraph>
                  <InvestmentSteps src={'/static/onboarding/2.svg'} alt="Investment steps" />
                  <div>
                    <Button primary label={`Sign Subscription Agreement`} href={agreementLink} fill={false} />
                  </div>
                </>
              )}

            {status?.kyc?.url &&
              status.kyc?.created &&
              !status.kyc?.verified &&
              !status.agreements[0]?.signed &&
              !agreementLink && (
                <>
                  <Paragraph
                    margin={{ top: 'small', bottom: 'small', left: 'auto', right: 'auto' }}
                    style={{ textAlign: 'center', width: '80%' }}
                  >
                    Your KYC status is pending, you can sign in again with your Securitize iD in order to continue with
                    the next step.
                  </Paragraph>
                  <InvestmentSteps src={'/static/onboarding/2.svg'} alt="Investment steps" />
                  <div>
                    <Button primary label={`Sign in with Securitize`} href={status.kyc?.url} fill={false} />
                  </div>
                </>
              )}

            {status?.kyc?.url &&
              status.agreements.every((agreement) => agreement.signed) &&
              !status.agreements.every((agreement) => agreement.counterSigned) && (
                <>
                  <Paragraph
                    margin={{ top: 'small', bottom: 'small', left: 'auto', right: 'auto' }}
                    style={{ textAlign: 'center', width: '80%' }}
                  >
                    Your KYC status is pending and you have signed the Subscription Agreement, which is pending a
                    signature from the issuer of {props.pool?.metadata.name}.
                  </Paragraph>
                  <InvestmentSteps src={'/static/onboarding/3.svg'} alt="Investment steps" />
                  <div>
                    <Button primary label={`Waiting for issuer's signature`} disabled fill={false} />
                  </div>
                </>
              )}

            {status?.kyc?.url &&
              !status.kyc?.verified &&
              status.agreements.length > 0 &&
              status.agreements.every((agreement) => agreement.counterSigned) && (
                <>
                  <Paragraph
                    margin={{ top: 'small', bottom: 'small', left: 'auto', right: 'auto' }}
                    style={{ textAlign: 'center', width: '80%' }}
                  >
                    The Subscription Agreement has been signed by you and the issuer of {props.pool?.metadata.name}.
                    Your KYC status is still pending.
                  </Paragraph>
                  <InvestmentSteps src={'/static/onboarding/3.svg'} alt="Investment steps" />
                  <div>
                    <Button primary label={`Waiting for KYC verification`} disabled fill={false} />
                  </div>
                </>
              )}

            {status?.kyc?.url &&
              status.kyc?.verified &&
              status.agreements.length > 0 &&
              status.agreements.every((agreement) => agreement.counterSigned) && (
                <>
                  <Paragraph
                    margin={{ top: 'small', bottom: 'small', left: 'auto', right: 'auto' }}
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
