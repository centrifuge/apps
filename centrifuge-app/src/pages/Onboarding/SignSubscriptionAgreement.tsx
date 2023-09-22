import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { AnchorButton, Box, Button, Checkbox, IconDownload, Shelf, Spinner, Stack, Text } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import * as React from 'react'
import { boolean, object } from 'yup'
import { ConfirmResendEmailVerificationDialog } from '../../components/Dialogs/ConfirmResendEmailVerificationDialog'
import { EditOnboardingEmailAddressDialog } from '../../components/Dialogs/EditOnboardingEmailAddressDialog'
import { ActionBar, Content, ContentHeader, Notification, NotificationBar } from '../../components/Onboarding'
import { OnboardingPool, useOnboarding } from '../../components/OnboardingProvider'
import { PDFViewer } from '../../components/PDFViewer'
import { ValidationToast } from '../../components/ValidationToast'
import { OnboardingUser } from '../../types'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { useSignAndSendDocuments } from './queries/useSignAndSendDocuments'
import { useSignRemark } from './queries/useSignRemark'
import { useUploadTaxInfo } from './queries/useUploadTaxInfo'
import { TaxInfo } from './TaxInfo'

type Props = {
  signedAgreementUrl: string | undefined
}

const validationSchema = object({
  isAgreed: boolean().oneOf([true], 'You must agree to the agreement'),
})

const GENERIC_SUBSCRIPTION_AGREEMENT = 'QmYuPPQuuc9ezYQtgTAupLDcLCBn9ZJgsPjG7mUx7qbN8G'

export const SignSubscriptionAgreement = ({ signedAgreementUrl }: Props) => {
  const { onboardingUser, pool, previousStep, nextStep } = useOnboarding<
    NonNullable<OnboardingUser>,
    NonNullable<OnboardingPool>
  >()
  const poolId = pool.id
  const trancheId = pool.trancheId
  const poolData = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(poolData)
  const centrifuge = useCentrifuge()

  const isTaxDocsRequired = poolMetadata?.onboarding?.taxInfoRequired
  const hasSignedAgreement = !!onboardingUser.poolSteps?.[poolId]?.[trancheId]?.signAgreement.completed
  const unsignedAgreementUrl = poolMetadata?.onboarding?.tranches?.[trancheId]?.agreement?.uri
    ? centrifuge.metadata.parseMetadataUrl(poolMetadata.onboarding.tranches[trancheId].agreement?.uri!)
    : !poolId.startsWith('0x')
    ? centrifuge.metadata.parseMetadataUrl(GENERIC_SUBSCRIPTION_AGREEMENT)
    : null

  const isEmailVerified = !!onboardingUser.globalSteps.verifyEmail.completed
  const formik = useFormik({
    initialValues: {
      isAgreed: hasSignedAgreement,
      isEmailVerified,
      taxInfo: undefined,
    },
    validationSchema,
    onSubmit: async (values) => {
      isTaxDocsRequired && (await uploadTaxInfo(values.taxInfo))
      signRemark([
        `I hereby sign the subscription agreement of pool ${poolId} and tranche ${trancheId}: ${poolMetadata?.onboarding?.tranches?.[trancheId]?.agreement?.uri}`,
      ])
    },
  })

  const { mutate: sendDocumentsToIssuer, isLoading: isSending } = useSignAndSendDocuments()
  const { execute: signRemark, isLoading: isSigningTransaction } = useSignRemark(sendDocumentsToIssuer)
  const { mutate: uploadTaxInfo, isLoading: isTaxUploadLoading } = useUploadTaxInfo()

  // tinlake pools without subdocs cannot accept investors
  const isPoolClosedToOnboarding = poolId.startsWith('0x') && !unsignedAgreementUrl
  const isCountrySupported =
    onboardingUser.investorType === 'entity'
      ? !poolMetadata?.onboarding?.kybRestrictedCountries?.includes(onboardingUser.jurisdictionCode)
      : !poolMetadata?.onboarding?.kycRestrictedCountries?.includes(onboardingUser.countryOfCitizenship)

  React.useEffect(() => {
    if (hasSignedAgreement) {
      formik.setFieldValue('isAgreed', true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSignedAgreement])

  return !isPoolClosedToOnboarding && isCountrySupported ? (
    <Content>
      {formik.errors.isEmailVerified && <ValidationToast label={formik.errors.isEmailVerified} />}
      {!hasSignedAgreement && onboardingUser.investorType === 'individual' && (
        <NotificationBar>
          <EmailVerificationInlineFeedback email={onboardingUser?.email as string} completed={isEmailVerified} />
        </NotificationBar>
      )}
      <ContentHeader
        title="Sign subscription agreement"
        body="Read the subscription agreement and click the box below to automatically e-sign the subscription agreement. You don't need to download and sign manually."
      />

      <Stack gap={1} alignItems="start">
        <Box
          position="relative"
          overflowY="auto"
          minHeight="30vh"
          maxHeight="500px"
          borderWidth={unsignedAgreementUrl ? 1 : 0}
          borderColor="borderPrimary"
          borderStyle="solid"
          borderRadius="tooltip"
        >
          {unsignedAgreementUrl ? (
            <PDFViewer file={(signedAgreementUrl ? signedAgreementUrl : unsignedAgreementUrl) as string} />
          ) : (
            <Shelf
              position="absolute"
              top={0}
              left={0}
              width="100%"
              height="100%"
              alignItems="center"
              justifyContent="center"
            >
              <Spinner size="iconLarge" />
            </Shelf>
          )}
        </Box>

        {!!unsignedAgreementUrl && (
          <AnchorButton
            href={signedAgreementUrl ?? unsignedAgreementUrl}
            download={`subscription-agreement-pool-${pool.id}.pdf`}
            variant="tertiary"
            icon={IconDownload}
            small
            target="_blank"
          >
            Download agreement
          </AnchorButton>
        )}

        {!!(poolId.startsWith('0x') && poolMetadata?.pool?.links.executiveSummary?.uri) && (
          <AnchorButton
            href={poolMetadata?.pool?.links.executiveSummary?.uri}
            download={`executive-summary-pool-${pool.id}.pdf`}
            variant="tertiary"
            icon={IconDownload}
            small
            target="_blank"
          >
            Executive summary attachment
          </AnchorButton>
        )}
      </Stack>
      {isTaxDocsRequired && (
        <TaxInfo
          value={formik.values.taxInfo}
          setValue={(file) => formik.setFieldValue('taxInfo', file)}
          touched={formik.touched.taxInfo}
          error={formik.errors.taxInfo}
        />
      )}
      <Checkbox
        {...formik.getFieldProps('isAgreed')}
        checked={formik.values.isAgreed}
        label={
          <Text style={{ cursor: 'pointer', paddingLeft: '6px' }}>
            I hereby sign and agree to the terms of the subscription agreement
          </Text>
        }
        disabled={isSigningTransaction || isSending || hasSignedAgreement || isTaxUploadLoading}
        errorMessage={formik.errors.isAgreed}
      />

      <ActionBar>
        <Button
          onClick={() => previousStep()}
          variant="secondary"
          disabled={isSigningTransaction || isSending || isTaxUploadLoading}
        >
          Back
        </Button>
        <Button
          onClick={hasSignedAgreement ? () => nextStep() : () => formik.handleSubmit()}
          loadingMessage="Signing"
          loading={isSigningTransaction || isSending || isTaxUploadLoading}
          disabled={
            isSigningTransaction ||
            isSending ||
            isTaxUploadLoading ||
            (isTaxDocsRequired && !formik.values.taxInfo) ||
            !formik.values.isAgreed
          }
        >
          {hasSignedAgreement ? 'Next' : 'Sign'}
        </Button>
      </ActionBar>
    </Content>
  ) : !isCountrySupported ? (
    <Content>
      <ContentHeader
        title="Country not supported"
        body={
          <span>
            This pool is currently not accepting new investors from your country. Please contact the issuer (
            <a href={`mailto:${poolMetadata?.pool?.issuer.email}?subject=Onboarding&body=I’m reaching out about…`}>
              {poolMetadata?.pool?.issuer.email}
            </a>
            ) for any questions.
          </span>
        }
      />
    </Content>
  ) : (
    <Content>
      <ContentHeader
        title="This pool is closed for onboarding"
        body={
          <span>
            This pool is currently not accepting new investors. Please contact the issuer (
            <a href={`mailto:${poolMetadata?.pool?.issuer.email}?subject=Onboarding&body=I’m reaching out about…`}>
              {poolMetadata?.pool?.issuer.email}
            </a>
            ) for any questions.
          </span>
        }
      />
    </Content>
  )
}

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
        currentEmail={email}
      />
    </>
  )
}
