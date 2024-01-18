import { Banner, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useUserRewards } from '../utils/tinlake/useTinlakeRewards'

export const ExpiringCFGRewardsBanner = () => {
  const [isOpen, setIsOpen] = React.useState(true)
  const { data } = useUserRewards()

  const hasUnclaimedRewards = data?.links.some((link) => (link.claimable ? !link.claimable?.isZero() : false))
  const expirationDate = new Date('2024-01-29T15:01')
  const currentDateCET = new Date().toLocaleString('en-US', { timeZone: 'CET' })
  const currentDateCETMillis = new Date(currentDateCET).getTime()
  const isExpired = currentDateCETMillis > expirationDate.getTime()
  const formattedExpirationDate = `${expirationDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} at ${expirationDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).toLowerCase()}`

  if (!hasUnclaimedRewards || isExpired) {
    return null
  }

  return (
    <Banner
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={
        <Text as="h3" color="textInverted" variant="heading5">
          Claim your rewards until {formattedExpirationDate} CET. After this day, users will not be able to claim their
          CFG rewards. Check{' '}
          <Text
            target="_blank"
            as="a"
            href="https://legacy.tinlake.centrifuge.io/rewards"
            color="textInverted"
            variant="heading5"
            display="inline"
            textDecoration="underline"
          >
            here
          </Text>{' '}
          if there are still unclaimed rewards. Read more{' '}
          <Text
            target="_blank"
            as="a"
            href="https://gov.centrifuge.io/t/cp81-unclaimed-tinlake-rewards/5885/4"
            color="textInverted"
            variant="heading5"
            display="inline"
            textDecoration="underline"
          >
            here
          </Text>
          .
        </Text>
      }
    />
  )
}
