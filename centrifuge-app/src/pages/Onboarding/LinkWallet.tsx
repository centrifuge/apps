import { useWallet } from '@centrifuge/centrifuge-react'
import { Button, Checkbox, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useAuth } from '../../components/AuthProvider'
import { DataSharingAgreementDialog } from '../../components/Dialogs/DataSharingAgreementDialog'
import { useOnboarding } from '../../components/OnboardingProvider'

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export const LinkWallet = () => {
  const [isDataSharingAgreementDialogOpen, setIsDataSharingAgreementDialogOpen] = React.useState(false)
  const [isAgreedToDataSharingAgreement, setIsAgreedToDataSharingAgreement] = React.useState(false)
  const { nextStep } = useOnboarding()

  const { selectedAccount } = useWallet().substrate
  const { login, isAuth } = useAuth()

  return (
    <Stack gap={4}>
      <Stack alignItems="flex-start" gap={4}>
        <Text fontSize={5}>Connect and link your wallet</Text>
        <Text>
          To start, you need to connect your wallet and sign a message to verify the wallet. You also need to agree to
          the data sharing agreement to continue with the identity verification process.
        </Text>
        <Shelf gap={1}>
          <Checkbox
            style={{
              cursor: 'pointer',
            }}
            checked={isAgreedToDataSharingAgreement || isAuth}
            onChange={() => setIsAgreedToDataSharingAgreement((current) => !current)}
            disabled={isAuth}
            label={
              <Shelf gap="4px">
                <Text style={{ cursor: 'pointer', paddingLeft: '6px' }}>I agree to the</Text>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Inter,sans-serif',
                  }}
                  onClick={() => setIsDataSharingAgreementDialogOpen(true)}
                >
                  <Text variant="body1" color="textInteractive">
                    Data sharing agreement.
                  </Text>
                </button>
              </Shelf>
            }
          />
          <DataSharingAgreementDialog
            isDialogOpen={isDataSharingAgreementDialogOpen}
            setIsDialogOpen={setIsDataSharingAgreementDialogOpen}
          />
        </Shelf>
        {isAuth ? (
          <Button onClick={() => nextStep()}>Next</Button>
        ) : (
          <Button
            disabled={!selectedAccount || !isAgreedToDataSharingAgreement}
            onClick={() => login(AUTHORIZED_ONBOARDING_PROXY_TYPES)}
          >
            Link your wallet
          </Button>
        )}
      </Stack>
    </Stack>
  )
}
