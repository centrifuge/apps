import { Spinner } from '@centrifuge/axis-spinner'
import { Anchor } from 'grommet'
import Link from 'next/link'
import * as React from 'react'
import { Button } from '../../components/Button'
import { ButtonGroup } from '../../components/ButtonGroup'
import { useDebugFlags } from '../../components/DebugFlags'
import { Box, Stack, Wrap } from '../../components/Layout'
import PoolList, { RwaMarketStandaloneRow } from '../../components/PoolList'
import PoolsMetrics from '../../components/PoolsMetrics'
import { Text } from '../../components/Text'
import TinlakeExplainer from '../../components/TinlakeExplainer'
import { IpfsPools } from '../../config'
import { useAddress } from '../../utils/useAddress'
import { useMedia } from '../../utils/useMedia'
import { useInvestorOnboardingState } from '../../utils/useOnboardingState'
import { usePools } from '../../utils/usePools'

interface Props {
  ipfsPools: IpfsPools
}

const Dashboard: React.FC<Props> = () => {
  const pools = usePools()
  const address = useAddress()
  const { data } = useInvestorOnboardingState()
  const isMobile = useMedia({ below: 'medium' })
  const { showRwaDetail } = useDebugFlags()

  return !pools.data ? (
    <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />
  ) : (
    <Stack gap="medium" pt="xlarge">
      {address ? (
        data &&
        !data.completed && (
          <Wrap gap="medium" justifyContent="space-between" flexDirection={['column', 'row']}>
            <Text fontSize="14px" fontWeight={500}>
              Onboard as investor by verifying KYC and subscribing to pools.{' '}
              <Anchor
                label="Read Onboarding Guide"
                href="https://docs.centrifuge.io/use/onboarding/"
                target="_blank"
                style={{ display: 'inline' }}
              />
            </Text>
            <ButtonGroup bleedY={[0, '10px']}>
              <Link href="/onboarding">
                <Button primary label="Onboard as investor" />
              </Link>
            </ButtonGroup>
          </Wrap>
        )
      ) : (
        <Box display={['none', 'block']}>
          <TinlakeExplainer />
        </Box>
      )}
      <PoolsMetrics totalValue={pools.data.totalValue} />
      {showRwaDetail && (
        <Link href="/pool/rwa" passHref>
          <RwaMarketStandaloneRow isMobile={!!isMobile} interactive as="a" target="" />
        </Link>
      )}

      <PoolList poolsData={pools.data} />
    </Stack>
  )
}

export default Dashboard
