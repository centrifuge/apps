import { Banner } from '@centrifuge/fabric'
import React from 'react'

export const DemoBanner = () => {
  const [isOpen, setIsOpen] = React.useState(window.location.hostname.includes('demo'))
  return (
    <Banner
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Welcome to the demo environment of the Centrifuge App. All data and wallet transactions are not real as this is purely a testing environment."
    />
  )
}
