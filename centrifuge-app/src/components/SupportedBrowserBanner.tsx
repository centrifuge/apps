import { Banner, Text } from '@centrifuge/fabric'
import * as React from 'react'

export const SupportedBrowserBanner = () => {
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

  if (isSupported) {
    return null
  }

  return (
    <Banner
      isOpen={isOpen}
      onClose={() => onClose()}
      title={
        <Text as="h3" color="textInverted" variant="heading5">
          Change or update your browser for a fully supported experience. Centrifuge App fully supports Chromium web
          browsers (Brave, Google Chrome or Opera).
        </Text>
      }
    />
  )
}
