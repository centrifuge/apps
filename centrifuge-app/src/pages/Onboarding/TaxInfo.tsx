import { AnchorButton, Box, Button } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import * as React from 'react'
import { boolean, mixed, object } from 'yup'
import { ConfirmResendEmailVerificationDialog } from '../../components/Dialogs/ConfirmResendEmailVerificationDialog'
import { EditOnboardingEmailAddressDialog } from '../../components/Dialogs/EditOnboardingEmailAddressDialog'
import {
  ActionBar,
  Content,
  ContentHeader,
  FileUpload,
  Notification,
  NotificationBar,
} from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { ValidationToast } from '../../components/ValidationToast'
import { OnboardingUser } from '../../types'
import { useTaxInfo } from './queries/useTaxInfo'
import { useUploadTaxInfo } from './queries/useUploadTaxInfo'

const validationSchema = object({
  taxInfo: mixed().required('Please upload a tax form'),
  isEmailVerified: boolean().oneOf([true], 'Please verify your email address'),
})

const EmailVerificationInlineFeedback = ({ email, completed }: { email: string; completed: boolean }) => {
  const [isEditOnboardingEmailAddressDialogOpen, setIsEditOnboardingEmailAddressDialogOpen] = React.useState(false)
  const [isConfirmResendEmailVerificationDialogOpen, setIsConfirmResendEmailVerificationDialogOpen] =
    React.useState(false)

  if (completed) {
    return <Notification>Email address verified</Notification>
  }

  return (
    <>
      <Notification type="alert">
        Please verify your email address. Email sent to {email}. If you did not receive an email,{' '}
        <button onClick={() => setIsConfirmResendEmailVerificationDialogOpen(true)}>send again</button> or{' '}
        <button onClick={() => setIsEditOnboardingEmailAddressDialogOpen(true)}>edit email</button>. Otherwise contact{' '}
        <a href="mailto:support@centrifuge.io?subject=Onboarding email verification&body=I’m reaching out about…">
          support@centrifuge.io
        </a>
        .
      </Notification>

      <EditOnboardingEmailAddressDialog
        currentEmail={email}
        isDialogOpen={isEditOnboardingEmailAddressDialogOpen}
        setIsDialogOpen={setIsEditOnboardingEmailAddressDialogOpen}
      />

      <ConfirmResendEmailVerificationDialog
        isDialogOpen={isConfirmResendEmailVerificationDialogOpen}
        setIsDialogOpen={setIsConfirmResendEmailVerificationDialogOpen}
      />
    </>
  )
}

export const TaxInfo = () => {
  const { onboardingUser, previousStep, nextStep, refetchOnboardingUser } = useOnboarding<NonNullable<OnboardingUser>>()
  const { data: taxInfoData } = useTaxInfo()
  const { mutate: uploadTaxInfo, isLoading } = useUploadTaxInfo()

  const isCompleted = !!onboardingUser.globalSteps.verifyTaxInfo.completed
  const isEmailVerified = !!onboardingUser.globalSteps.verifyEmail.completed

  const formik = useFormik({
    initialValues: {
      taxInfo: undefined,
      isEmailVerified,
    },
    validationSchema,
    onSubmit: (values: { taxInfo: File | undefined }) => {
      uploadTaxInfo(values.taxInfo)
    },
  })

  const onFocus = () => {
    refetchOnboardingUser()
  }

  React.useEffect(() => {
    if (isEmailVerified) {
      formik.setFieldValue('isEmailVerified', true)
      window.removeEventListener('focus', onFocus)
    } else {
      window.addEventListener('focus', onFocus)
    }

    return () => {
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmailVerified])

  const validateFileUpload = (file: File) => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed'
    }

    if (file.size > 1024 * 1024) {
      return 'Maximum file size allowed is 1MB'
    }
  }

  const taxForm = React.useMemo(() => {
    if (onboardingUser.investorType === 'individual' && onboardingUser.countryOfCitizenship !== 'us') {
      return {
        type: 'W-8BEN',
        url: 'https://www.irs.gov',
        label: 'www.irs.gov',
      }
    }

    if (onboardingUser.investorType === 'entity' && !onboardingUser.jurisdictionCode.startsWith('us')) {
      return {
        type: 'W-8BEN-E',
        url: 'https://www.irs.gov',
        label: 'www.irs.gov',
      }
    }

    return {
      type: 'W9',
      url: 'https://www.irs.gov',
      label: 'www.irs.gov',
    }
  }, [onboardingUser])

  return (
    <>
      {formik.errors.isEmailVerified && <ValidationToast label={formik.errors.isEmailVerified} />}
      <Content>
        {!isCompleted && onboardingUser.investorType === 'individual' && (
          <NotificationBar>
            <EmailVerificationInlineFeedback email={onboardingUser?.email as string} completed={isEmailVerified} />
          </NotificationBar>
        )}

        <ContentHeader
          title="Tax information"
          body={
            <>
              Please complete and upload a {taxForm.type} form. The form can be found at{' '}
              <a href={taxForm.url} target="_blank" rel="noreferrer">
                {taxForm.label}
              </a>
              .
            </>
          }
        />

        <Box>
          {isCompleted ? (
            <Box>
              <AnchorButton variant="secondary" href={taxInfoData} target="__blank">
                View uploaded tax form
              </AnchorButton>
            </Box>
          ) : (
            <FileUpload
              onFileChange={(file) => formik.setFieldValue('taxInfo', file)}
              disabled={isLoading || isCompleted}
              file={formik.values.taxInfo || null}
              errorMessage={formik.touched.taxInfo ? formik.errors.taxInfo : undefined}
              validate={validateFileUpload}
              accept=".pdf"
            />
          )}
        </Box>
      </Content>

      <ActionBar>
        <Button onClick={() => previousStep()} variant="secondary" disabled={isLoading}>
          Back
        </Button>
        <Button
          onClick={() => {
            isCompleted ? nextStep() : formik.handleSubmit()
          }}
          disabled={isLoading}
          loading={isLoading}
          loadingMessage="Uploading"
        >
          Next
        </Button>
      </ActionBar>
    </>
  )
}
