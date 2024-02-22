import { Stack } from '@centrifuge/fabric'
import React from 'react'
import { useHistory } from 'react-router'
import { InvestmentDisclaimerDialog } from '../components/Dialogs/InvestmentDisclaimerDialog'
import { LayoutBase } from '../components/LayoutBase'

export default function InvestmentDisclaimerPage() {
  const [isOpen, setIsOpen] = React.useState(true)
  const history = useHistory()
  return (
    <LayoutBase>
      <Stack p="6" gap="4">
        <InvestmentDisclaimerDialog
          open={isOpen}
          onClose={() => {
            setIsOpen(false)
            history.push('/pools')
          }}
        />
      </Stack>
    </LayoutBase>
  )
}
