import { Banner, Text } from '@centrifuge/fabric'
import React from 'react'

export const DemoBanner = () => {
  const [isOpen, setIsOpen] = React.useState(import.meta.env.REACT_APP_IS_DEMO)

  return (
    <Banner
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={
        <Text as="h3" color="textInverted" variant="heading5">
          Welcome to the demo environment of the Centrifuge App. All data and wallet transactions are not real as this
          is purely a testing environment. Read{' '}
          <Text
            target="_blank"
            as="a"
            href="https://centrifuge.hackmd.io/@Anna/H1ylqpRQj"
            color="textInverted"
            variant="heading5"
            underline
            display="inline"
          >
            here
          </Text>{' '}
          how to get started
        </Text>
      }
    />
  )
}
