import { useWallet } from '@centrifuge/centrifuge-react'
import { Banner, Text } from '@centrifuge/fabric'
import * as React from 'react'

export const SupportedBrowserBanner = () => {
  const wallet = useWallet()
  const storageKey = 'browser-banner-seen'
  const isSupported = navigator.userAgent.indexOf('Chrome') > -1
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setIsOpen(localStorage.getItem(storageKey) !== 'true')
  }, [])

  function onClose() {
    localStorage.setItem(storageKey, 'true')
    setIsOpen(false)
  }

  if (isSupported || !wallet.connectedNetwork) {
    return null
  }

  return (
    <Banner
      isOpen={isOpen}
      onClose={() => onClose()}
      title={
        <Text as="h3" color="textInverted" variant="heading4">
          Change your browser for a fully supported experience. Centrifuge App supports Chromium web browsers (Brave,
          Google Chrome or Opera).
        </Text>
      }
    />
  )
}
