import { Heading } from 'grommet'
import React from 'react'

export const SectionHeading: React.FC = ({ children }) => {
  return (
    <Heading margin="none" level={2} size="16px">
      {children}
    </Heading>
  )
}
