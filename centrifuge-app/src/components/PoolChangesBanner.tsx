import { Banner, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useLoanChanges, usePoolChanges } from '../utils/usePools'
import { RouterTextLink } from './TextLink'

export type PoolChangesBannerProps = {
  poolId: string
}
const STORAGE_KEY = 'poolChangesBannerDismissedAt'

export function PoolChangesBanner({ poolId }: PoolChangesBannerProps) {
  const changes = usePoolChanges(poolId)
  const loanChanges = useLoanChanges(poolId)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const dismissedAt = new Date(localStorage.getItem(STORAGE_KEY) ?? 0)
    if (
      (changes && new Date(changes.submittedAt) > dismissedAt) ||
      (loanChanges?.length && new Date(loanChanges.at(-1)!.submittedAt) > dismissedAt)
    ) {
      setIsOpen(true)
    }
  }, [changes, loanChanges])

  function onClose() {
    localStorage.setItem(STORAGE_KEY, new Date(Date.now()).toISOString())
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
