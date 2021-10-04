import { Box, Paragraph } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { Pool, UpcomingPool } from '../../config'
import { ensureAuthed } from '../../ducks/auth'
import { useAddress } from '../../utils/useAddress'
import { useInvestorOnboardingState } from '../../utils/useOnboardingState'
import { usePool } from '../../utils/usePool'
import { Button } from '../Button'
import { useDebugFlags } from '../DebugFlags'
import { PoolLink } from '../PoolLink'
import { Tooltip } from '../Tooltip'
import { FormModal, InvestmentSteps } from './styles'

interface Props {
  pool: Pool | UpcomingPool
  tranche?: 'junior' | 'senior'
}

const InvestAction: React.FC<Props> = (props) => {
  const { newOnboarding } = useDebugFlags()
  const { data: investorOnboardingData } = useInvestorOnboardingState()
  const [modalIsOpen, setModalIsOpen] = React.useState(false)
  const [awaitingConnectAndData, setAwaitingConnectAndData] = React.useState(false)
  const address = useAddress()
  const router = useRouter()
  const dispatch = useDispatch()

  const onOpen = () => setModalIsOpen(true)
  const onClose = () => setModalIsOpen(false)

  const { data: poolData } = usePool(
    props.pool && 'addresses' in props.pool ? props.pool.addresses.ROOT_CONTRACT : undefined
  )

  const hasPoolData = props.pool ? !!poolData : true
  const hasUserData = address ? !!investorOnboardingData : true
  const hasData = hasPoolData && hasUserData

  const isUpcoming = poolData?.isUpcoming || true
  const hasDoneKYC = investorOnboardingData?.completed
  const canInvestInPool =
    props.pool && props.tranche
      ? poolData?.[props.tranche]?.inMemberlist
      : poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist

  function navigate() {
    if (isUpcoming) {
      if (!hasDoneKYC) {
        router.push('/onboarding')
      }
    } else {
      const basePath = `/pool/${(props.pool as Pool).addresses.ROOT_CONTRACT}/${props.pool?.metadata.slug}`
      if (canInvestInPool) {
        router.push(`${basePath}/investments`)
      } else {
        router.push(`${basePath}/onboarding`)
      }
    }
  }

  async function connectAndNavigate() {
    if (!address) {
      setAwaitingConnectAndData(true)
      try {
        await dispatch(ensureAuthed())
      } catch (e) {
        console.log('caught', e)
        setAwaitingConnectAndData(false)
      }
      return
    }
    if (!hasData) {
      setAwaitingConnectAndData(true)
      return
    }

    navigate()
  }

  React.useEffect(() => {
    if (awaitingConnectAndData && address && hasData) {
      setAwaitingConnectAndData(false)
      navigate()
    }
  }, [address, hasData, awaitingConnectAndData])

  const buttonLabel = isUpcoming && address && !hasDoneKYC ? 'Onboard as investor' : 'Invest'

  return (
    <>
      {newOnboarding ? (
        isUpcoming && address && hasDoneKYC ? (
          <Tooltip title="Upcoming pool" description="This upcoming pool is not open for investments yet">
            <Button primary label="Invest" disabled />
          </Tooltip>
        ) : (
          <Button primary label={buttonLabel} onClick={connectAndNavigate} />
        )
      ) : (
        <>
          {props.pool && (poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist) && (
            <Box>
              <PoolLink href="/investments">
                <Button primary label="Invest" fill={false} />
              </PoolLink>
            </Box>
          )}
          {props.pool && !(poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist) && (
            <Box>
              <Button primary label="Invest" fill={false} onClick={onOpen} />
            </Box>
          )}
        </>
      )}

      <FormModal opened={modalIsOpen} title={'Interested in investing?'} onClose={onClose} style={{ width: '800px' }}>
        <Paragraph margin={{ top: 'small', bottom: 'small' }}>
          Tinlake has integrated Securitize.io’s automated KYC process for a smooth investor onboarding. Once Securitize
          has verified your documentation you will be provided with your “Securitize iD” which makes you eligible to
          invest in all open Tinlake pools. To invest in an individual pool you will be asked to sign the subscription
          agreement with the pool’s issuer also provided through the Securitize dashboard.
        </Paragraph>

        <InvestmentSteps src="/static/kyc-steps.svg" alt="Investment steps" />

        <Box
          direction="row"
          justify="center"
          width={props.pool && !isUpcoming ? '80%' : '40%'}
          margin={{ left: 'auto', right: 'auto' }}
          gap="medium"
          style={{ textAlign: 'center' }}
        >
          <Box flex={true} justify="between">
            <Paragraph>Start your KYC process to become to become an eligible investor.</Paragraph>
            {(props.pool as Pool)?.metadata.securitize?.issuerId ? (
              <Button
                primary
                label={`Onboard as an investor`}
                fill={false}
                href={`https://id.securitize.io/#/authorize?registration=true&issuerId=${
                  (props.pool as Pool).metadata.securitize?.issuerId
                }&scope=info%20details%20verification&redirecturl=https://${
                  (props.pool as Pool).metadata.securitize?.slug
                }.invest.securitize.io/%23/authorize`}
                target="_blank"
              />
            ) : (
              <Button
                primary
                label={`Onboard as an investor`}
                href={`https://id.securitize.io/#/authorize?issuerId=4d11b353-a327-49ab-b45b-ae5be60697c6&scope=info%20details%20verification&registration=true&redirecturl=https://centrifuge.invest.securitize.io/#/authorize`}
                fill={false}
                target="_blank"
              />
            )}
          </Box>
          {!isUpcoming && props.pool && (
            <Box flex={true} justify="between">
              {isUpcoming && <Paragraph>This pool is not open for investments yet</Paragraph>}
              {!isUpcoming && (
                <Paragraph>Already an eligible investor? Sign the pool issuers Subscription Agreement.</Paragraph>
              )}
              {(props.pool as Pool)?.metadata.securitize?.issuerId && (
                <Button
                  primary
                  label={`Sign up for this pool`}
                  fill={false}
                  href={`https://id.securitize.io/#/authorize?issuerId=${
                    (props.pool as Pool).metadata.securitize?.issuerId
                  }&scope=info%20details%20verification&redirecturl=https://${
                    (props.pool as Pool).metadata.securitize?.slug
                  }.invest.securitize.io/%23/authorize`}
                  target="_blank"
                  disabled={isUpcoming}
                />
              )}
            </Box>
          )}
        </Box>

        {props.pool && (
          <Paragraph
            margin={{ top: 'medium', bottom: '0', left: 'large', right: 'large' }}
            style={{ textAlign: 'center' }}
          >
            Any questions left? Feel free to reach out to the Issuer directly (see Pool Overview).
          </Paragraph>
        )}

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

export default InvestAction
