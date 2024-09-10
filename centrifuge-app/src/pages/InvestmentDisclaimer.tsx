import { Stack } from '@centrifuge/fabric'
import React from 'react'
import { useNavigate } from 'react-router'
import { InvestmentDisclaimerDialog } from '../components/Dialogs/InvestmentDisclaimerDialog'

export default function InvestmentDisclaimerPage() {
  const [isOpen, setIsOpen] = React.useState(true)
  const navigate = useNavigate()
  return (
    <Stack p="6" gap="4">
      <InvestmentDisclaimerDialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false)
          navigate('/pools')
        }}
      />
    </Stack>
  )
}
