import { Stack } from '@centrifuge/fabric'
import React from 'react'
import { useHistory } from 'react-router'
import { InvestmentDisclaimerDialog } from '../components/Dialogs/InvestmentDisclaimerDialog'
import { PageWithSideBar } from '../components/PageWithSideBar'

export const InvestmentDisclaimerPage: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(true)
  const history = useHistory()
  return (
    <PageWithSideBar sidebar>
      <Stack p="6" gap="4">
        <InvestmentDisclaimerDialog
          open={isOpen}
          onClose={() => {
            setIsOpen(false)
            history.push('/investments')
          }}
        />
      </Stack>
    </PageWithSideBar>
  )
}
