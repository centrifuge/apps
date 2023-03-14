import { useWallet } from '@centrifuge/centrifuge-react'
import { Button, Checkbox, Shelf, Text } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import * as React from 'react'
import { boolean, object } from 'yup'
import { useAuth } from '../../components/AuthProvider'
import { DataSharingAgreementDialog } from '../../components/Dialogs/DataSharingAgreementDialog'
import { ActionBar, Content, ContentHeader } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

const validationSchema = object({
  isAgreedToDataSharingAgreement: boolean().oneOf([true], 'You must agree to the data sharing agreement'),
  hasSelectedWallet: boolean().oneOf([true], 'Please connect your wallet'),
})

export const LinkWallet = () => {
  const [isDataSharingAgreementDialogOpen, setIsDataSharingAgreementDialogOpen] = React.useState(false)
  const { nextStep } = useOnboarding()

  const { selectedAccount } = useWallet().substrate
  const { login, isAuth } = useAuth()

  const formik = useFormik({
    initialValues: {
      isAgreedToDataSharingAgreement: false,
      hasSelectedWallet: false,
    },
    validationSchema,
    onSubmit: () => {
      login(AUTHORIZED_ONBOARDING_PROXY_TYPES)
    },
  })

  React.useEffect(() => {
    if (selectedAccount) {
      formik.setFieldValue('hasSelectedWallet', true, false)
    }

    if (!selectedAccount) {
      formik.setFieldValue('hasSelectedWallet', false, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount])

  return (
    <>
      <Content>
        <ContentHeader
          title="Connect and link your wallet"
          body="To start, you need to connect your wallet in the top right corner and sign a message to verify the wallet. You also need to agree to the data sharing agreement to continue with the identity verification process."
        />

        <Shelf gap={1}>
          <Checkbox
            {...formik.getFieldProps('isAgreedToDataSharingAgreement')}
            checked={isAuth || formik.values.isAgreedToDataSharingAgreement}
            disabled={isAuth}
            errorMessage={formik.errors.isAgreedToDataSharingAgreement}
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
                    data sharing agreement.
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
      </Content>

      <ActionBar>
        {isAuth ? (
          <Button onClick={() => nextStep()}>Next</Button>
        ) : (
          <Button
            onClick={() => {
              isAuth ? nextStep() : formik.handleSubmit()
            }}
          >
            Continue
          </Button>
        )}
      </ActionBar>
    </>
  )
}
