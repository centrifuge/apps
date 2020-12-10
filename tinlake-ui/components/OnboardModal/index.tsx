import { Anchor, Box, Button, Paragraph } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import config, { Pool, UpcomingPool } from '../../config'
import { ensureAuthed } from '../../ducks/auth'
import { PoolData as PoolDataV3, PoolState } from '../../ducks/pool'
import { PoolsState } from '../../ducks/pools'
import { PoolLink } from '../PoolLink'
import { FormModal, InvestmentSteps } from './styles'
import { AddressStatus } from '@centrifuge/onboard-api/src/controllers/types'

interface Props {
  anchor?: React.ReactNode
  pool?: Pool | UpcomingPool
}

const OnboardModal: React.FC<Props> = (props: Props) => {
  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const onOpen = () => setModalIsOpen(true)
  const onClose = () => setModalIsOpen(false)

  const router = useRouter()
  const dispatch = useDispatch()

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

  React.useEffect(() => {
    if (address) getOnboardingStatus()
  }, [address])

  React.useEffect(() => {
    if (!modalIsOpen && 'onb' in router.query && router.query.onb === '1') {
      setModalIsOpen(true)
    }
  }, [router.query])

  React.useEffect(() => {
    // if (props.pool) {
    //   const pool = pools.data?.pools.find((pool: PoolData) => {
    //     return 'addresses' in props.pool! && pool.id === (props.pool as Pool).addresses.ROOT_CONTRACT.toLowerCase()
    //   })

    //   if (pool) setStatus(getPoolStatus(pool))

    //   console.log({ status })
    // }

    getOnboardingStatus()
  }, [pools])

  return (
    <>
      {props.pool && (poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist) && (
        <Box margin={{ left: 'auto' }}>
          <PoolLink href={'/investments'}>
            <Button primary label="Invest" fill={false} />
          </PoolLink>
        </Box>
      )}
      {props.pool && !(poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist) && (
        <Box margin={{ left: 'auto' }}>
          <Button primary label="Get started" fill={false} onClick={onOpen} />
        </Box>
      )}
      {!props.pool && (
        <Anchor
          onClick={onOpen}
          margin={{ top: 'small', bottom: 'small' }}
          label="Interested in investing in Tinlake pools? Start your onboarding process now"
        />
      )}

      <FormModal opened={modalIsOpen} title={'Interested in investing?'} onClose={onClose} style={{ width: '800px' }}>
        <Paragraph margin={{ top: 'small', bottom: 'small' }}>
          Tinlake has integrated Securitize.io’s automated KYC process for a smooth investor onboarding. Once Securitize
          has verified your documentation you will be provided with your “Securitize iD” which makes you eligible to
          invest in all open Tinlake pools. To invest in an individual pool you will be asked to sign the subscription
          agreement with the pool’s issuer also provided through the Securitize dashboard.
        </Paragraph>
        <InvestmentSteps
          src={
            !status?.kyc.created
              ? '/static/onboarding/1.svg'
              : status.agreements[0]?.signed
              ? '/static/onboarding/3.svg'
              : '/static/onboarding/2.svg'
          }
          alt="Investment steps"
        />
        <Box
          direction="row"
          justify="center"
          width={'40%'}
          margin={{ left: 'auto', right: 'auto' }}
          gap="medium"
          style={{ textAlign: 'center' }}
        >
          {!address && (
            <Box flex={true} justify="between">
              <Paragraph>Please connect with the wallet you want to use for investment.</Paragraph>
              <Button primary label={`Connect`} onClick={connect} fill={false} />
            </Box>
          )}
          {address && !status && (
            <Box flex={true} justify="between">
              <Paragraph>Loading...</Paragraph>
            </Box>
          )}
          {status?.kyc.url && !status.kyc.created && (
            <Box flex={true} justify="between">
              <Paragraph>Ready to start the KYC process to onboard as an investor.</Paragraph>
              <Button primary label={`Start KYC`} href={status.kyc.url} fill={false} />
            </Box>
          )}
          {status?.kyc.url &&
            status.kyc.created &&
            !status.kyc.verified &&
            !status.agreements[0]?.signed &&
            agreementLink && (
              <Box flex={true} justify="between">
                <Paragraph>
                  Your KYC status is pending, you can already continue by signing the Subscription Agreement for{' '}
                  {props.pool?.metadata.name}.
                </Paragraph>
                <Button primary label={`Sign Subscription Agreement`} href={agreementLink} fill={false} />
              </Box>
            )}
          {status?.kyc.url &&
            status.kyc.created &&
            !status.kyc.verified &&
            !status.agreements[0]?.signed &&
            !agreementLink && (
              <Box flex={true} justify="between">
                <Paragraph>
                  Your KYC status is pending, you can sign in again with your Securitize iD in order to continue with
                  the next step.
                </Paragraph>
                <Button primary label={`Sign in with Securitize`} href={status.kyc.url} fill={false} />
              </Box>
            )}
          {status?.kyc.url &&
            status.agreements.every((agreement) => agreement.signed) &&
            !status.agreements.every((agreement) => agreement.counterSigned) && (
              <Box flex={true} justify="between">
                <Paragraph>
                  Your KYC status is pending and you have signed the Subscription Agreement, which is pending a
                  signature from the issuer of {props.pool?.metadata.name}.
                </Paragraph>
              </Box>
            )}
          {status?.kyc.url &&
            !status.kyc.verified &&
            status.agreements.length > 0 &&
            status.agreements.every((agreement) => agreement.counterSigned) && (
              <Box flex={true} justify="between">
                <Paragraph>
                  The Subscription Agreement has been signed by you and the issuer of {props.pool?.metadata.name}. Your
                  KYC status is still pending.
                </Paragraph>
                <Button primary label={`Waiting for KYC verification`} disabled fill={false} />
              </Box>
            )}
          {status?.kyc.url &&
            status.kyc.verified &&
            status.agreements.length > 0 &&
            status.agreements.every((agreement) => agreement.counterSigned) && (
              <Box flex={true} justify="between">
                <Paragraph>
                  You have completed onboarding successfuly for {props.pool?.metadata.name} and can now invest.
                </Paragraph>
              </Box>
            )}
        </Box>
        {/* {props.pool && (
          <Paragraph
            margin={{ top: 'medium', bottom: '0', left: 'large', right: 'large' }}
            style={{ textAlign: 'center' }}
          >
            Any questions left? Feel free to reach out to the Issuer directly (see Pool Overview).
          </Paragraph>
        )} */}
        {!props.pool && (
          <Paragraph
            margin={{ top: 'medium', bottom: '0', left: 'large', right: 'large' }}
            style={{ textAlign: 'center' }}
          >
            Already an eligible Tinlake investor? Head over to the individual pools to get started with signing the
            subscription agreement or login to Securitize and select the respective pool there.
          </Paragraph>
        )}
      </FormModal>
    </>
  )
}

export default OnboardModal
