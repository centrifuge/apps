import * as React from 'react'
import { Box, Button, Paragraph, Anchor } from 'grommet'
import { useSelector } from 'react-redux'
import { PoolsState, PoolData } from '../../ducks/pools'
import { PoolData as PoolDataV3, PoolState } from '../../ducks/pool'

import { FormModal, InvestmentSteps } from './styles'
import { Pool, UpcomingPool } from '../../config'
import { getPoolStatus } from '../../utils/pool'
import { PoolLink } from '../PoolLink'
import config from '../../config'

interface Props {
  anchor?: React.ReactNode
  pool?: Pool | UpcomingPool
}

const InvestAction: React.FC<Props> = (props: Props) => {
  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const onOpen = () => setModalIsOpen(true)
  const onClose = () => setModalIsOpen(false)

  const pools = useSelector<any, PoolsState>((state) => state.pools)
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolDataV3 | undefined

  const [status, setStatus] = React.useState('Open')
  const [authorizationLink, setAuthorizationLink] = React.useState('')

  const getAuthorizationLink = async () => {
    const req = await fetch(`${config.onboardAPIHost}authorization`)
    const link = await req.text()
    console.log({ link })
    setAuthorizationLink(link)
  }

  React.useEffect(() => {
    if (props.pool) {
      const pool = pools.data?.pools.find((pool: PoolData) => {
        return 'addresses' in props.pool! && pool.id === (props.pool as Pool).addresses.ROOT_CONTRACT.toLowerCase()
      })

      if (pool) setStatus(getPoolStatus(pool))
    }

    getAuthorizationLink()
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

        <InvestmentSteps src="/static/kyc-steps.svg" alt="Investment steps" />

        <Box
          direction="row"
          justify="center"
          width={'40%'}
          margin={{ left: 'auto', right: 'auto' }}
          gap="medium"
          style={{ textAlign: 'center' }}
        >
          <Box flex={true} justify="between">
            <Paragraph>Start your KYC process to become to become an eligible investor.</Paragraph>
            <Button primary label={`Start KYC`} href={authorizationLink} fill={false} />
          </Box>
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
