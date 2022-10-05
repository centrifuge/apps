import { Banner } from '@centrifuge/fabric'
import React from 'react'

export const DemoBanner = () => {
  const [isOpen, setIsOpen] = React.useState(window.location.hostname.includes('demo'))
  return (
    <Banner
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Welcome to the demo environment! Data is not persisted infinitely, and tokens are linked to a faucet."
    />
  )
}
