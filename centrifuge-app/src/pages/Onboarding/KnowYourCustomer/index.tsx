import { Box, Button, Dialog, Flex, Stack } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import * as React from 'react'
import { boolean, date, object, string } from 'yup'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { useStartKYC } from '../queries/useStartKYC'
import { useVerifyIdentity } from '../queries/useVerifyIdentity'
import { IdentityVerification } from './IdentityVerification'
import { SignerVerification } from './SignerVerification'

const getValidationSchema = (investorType: 'individual' | 'entity') =>
  object({
    name: string().required('Please enter a name'),
    dateOfBirth: date()
      .required('Please enter a date of birth')
      .min(new Date(1900, 0, 1), 'Date of birth must be after 1900')
      .max(new Date(new Date().getFullYear() - 18, new Date().getMonth()), 'You must be 18 or older'),
    countryOfCitizenship: string().required('Please select a country of citizenship'),
    countryOfResidency: string().required('Please select a country of residency'),
    isAccurate: boolean().oneOf([true], 'You must confirm that the information is accurate'),
    ...(investorType === 'individual' && {
      email: string().email('Please enter a valid email address').required('Please enter an email address'),
    }),
  })

export const KnowYourCustomer = () => {
  const [isKnowYourCustomerDialogOpen, setIsKnowYourCustomerDialogOpen] = React.useState(false)

  const [verificationDeclined, setVerificationDeclined] = React.useState(false)

  const { onboardingUser } = useOnboarding()

  const investorType = onboardingUser?.investorType === 'entity' ? 'entity' : 'individual'

  const isCompleted = !!onboardingUser?.globalSteps?.verifyIdentity.completed

  const validationSchema = getValidationSchema(investorType)

  const formik = useFormik({
    initialValues: {
      name: onboardingUser?.name || '',
      dateOfBirth: onboardingUser?.dateOfBirth || '',
      countryOfCitizenship: onboardingUser?.countryOfCitizenship || '',
      countryOfResidency: onboardingUser?.countryOfResidency || '',
      isAccurate: !!isCompleted,
      email: investorType === 'individual' ? onboardingUser?.email || '' : undefined,
    },
    onSubmit: (values) => {
      startKYC(values)
    },
    validationSchema,
    validateOnMount: true,
    enableReinitialize: true,
  })

  const { mutate: startKYC, data: startKYCData, isLoading: isStartKYCLoading } = useStartKYC()

  const { mutate: setVerifiedIdentity } = useVerifyIdentity()

  const handleVerifiedIdentity = (event: MessageEvent) => {
    if (event.origin === 'https://app.shuftipro.com' && event.data.verification_status === 'verification.accepted') {
      setVerifiedIdentity()
    }
    if (event.origin === 'https://app.shuftipro.com' && event.data.verification_status === 'verification.declined') {
      setVerificationDeclined(true)
    }
  }

  React.useEffect(() => {
    window.addEventListener('message', handleVerifiedIdentity)

    return () => {
      window.removeEventListener('message', handleVerifiedIdentity)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (startKYCData?.verification_url) {
      setIsKnowYourCustomerDialogOpen(true)
    }
  }, [startKYCData])

  return (
    <>
      <SignerVerification formik={formik} isLoading={isStartKYCLoading} isCompleted={isCompleted} />
      {startKYCData?.verification_url && (
        <Dialog
          isOpen={isKnowYourCustomerDialogOpen}
          onClose={() => setIsKnowYourCustomerDialogOpen(false)}
          width="850px"
        >
          <Stack justifyContent="space-between">
            <Box height="500px">
              <IdentityVerification verificationURL={startKYCData.verification_url} />
            </Box>
            {verificationDeclined && (
              <Flex justifyContent="flex-end">
                <Button
                  variant="primary"
                  onClick={() => {
                    setVerificationDeclined(false)
                    setIsKnowYourCustomerDialogOpen(false)
                  }}
                >
                  Restart verification
                </Button>
              </Flex>
            )}
          </Stack>
        </Dialog>
      )}
    </>
  )
}
