import { Banner, Text } from '@centrifuge/fabric'
import * as React from 'react'

export const DemoBanner = () => {
  const storageKey = 'demo-banner-seen'
  const isDemo = import.meta.env.REACT_APP_IS_DEMO
  const isStaging = window?.location.origin === 'https://app.staging.centrifuge.io'
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setIsOpen(localStorage.getItem(storageKey) !== 'true')
  }, [])

  function onClose() {
    localStorage.setItem(storageKey, 'true')
    setIsOpen(false)
  }

  if (!isDemo && !isStaging) {
    return null
  }

  return (
    <Banner
      isOpen={isOpen}
      onClose={() => onClose()}
      title={
        <Text as="h3" color="white" variant="heading4">
          Welcome to the demo environment of the Centrifuge App. All data and wallet transactions are not real as this
          is purely a testing environment. Read{' '}
          <Text
            target="_blank"
            as="a"
            href="https://centrifuge.hackmd.io/@Anna/H1ylqpRQj"
            color="white"
            variant="heading4"
            display="inline"
            textDecoration="underline"
          >
            here
          </Text>{' '}
          how to get started
        </Text>
      }
    />
  )
}
