import { Banner, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useLoanChanges, usePoolChanges } from '../utils/usePools'
import { RouterTextLink } from './TextLink'

export type PoolChangesBannerProps = {
  poolId: string
}
const STORAGE_KEY = 'poolChangesBannerDismissed'

export function PoolChangesBanner({ poolId }: PoolChangesBannerProps) {
  const poolChanges = usePoolChanges(poolId)
  const { policyChanges } = useLoanChanges(poolId)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const dismissed = !!sessionStorage.getItem(STORAGE_KEY)
    const hasReady = policyChanges?.some((change) => change.status === 'ready') || poolChanges?.status === 'ready'
    if (!dismissed && hasReady) {
      setIsOpen(true)
    }
  }, [poolChanges, policyChanges])

  function onClose() {
    sessionStorage.setItem(STORAGE_KEY, '1')
    setIsOpen(false)
  }

  return (
    <Banner
      isOpen={isOpen}
      onClose={onClose}
      title={
        <Text as="h3" color="textInverted" variant="heading5">
          There are pending pool changes that can now be enabled{' '}
          <RouterTextLink to={`/issuer/${poolId}/configuration`}>here</RouterTextLink>
        </Text>
      }
    />
  )
}
