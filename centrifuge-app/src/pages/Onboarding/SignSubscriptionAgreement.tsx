import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { AnchorButton, Box, Button, Checkbox, IconDownload, Shelf, Spinner, Stack, Text } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import * as React from 'react'
import { boolean, object } from 'yup'
import { ActionBar, Content, ContentHeader } from '../../components/Onboarding'
import { OnboardingPool, useOnboarding } from '../../components/OnboardingProvider'
import { PDFViewer } from '../../components/PDFViewer'
import { OnboardingUser } from '../../types'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { useSignAndSendDocuments } from './queries/useSignAndSendDocuments'
import { useSignRemark } from './queries/useSignRemark'

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

  const hasSignedAgreement = !!onboardingUser.poolSteps?.[poolId]?.[trancheId]?.signAgreement.completed
  const unsignedAgreementUrl = poolMetadata?.onboarding?.tranches?.[trancheId]?.agreement?.uri
    ? centrifuge.metadata.parseMetadataUrl(poolMetadata.onboarding.tranches[trancheId].agreement?.uri!)
    : !poolId.startsWith('0x')
    ? centrifuge.metadata.parseMetadataUrl(GENERIC_SUBSCRIPTION_AGREEMENT)
    : null

  const formik = useFormik({
    initialValues: {
      isAgreed: hasSignedAgreement,
    },
    validationSchema,
    onSubmit: () => {
      signRemark([
        `I hereby sign the subscription agreement of pool ${poolId} and tranche ${trancheId}: ${poolMetadata?.onboarding?.tranches?.[trancheId]?.agreement?.uri}`,
      ])
    },
  })

  const { mutate: sendDocumentsToIssuer, isLoading: isSending } = useSignAndSendDocuments()
  const { execute: signRemark, isLoading: isSigningTransaction } = useSignRemark(sendDocumentsToIssuer)

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
      <Checkbox
        {...formik.getFieldProps('isAgreed')}
        checked={formik.values.isAgreed}
        label={
          <Text style={{ cursor: 'pointer', paddingLeft: '6px' }}>
            I hereby sign and agree to the terms of the subscription agreement
          </Text>
        }
        disabled={isSigningTransaction || isSending || hasSignedAgreement}
        errorMessage={formik.errors.isAgreed}
      />

      <ActionBar>
        <Button onClick={() => previousStep()} variant="secondary" disabled={isSigningTransaction || isSending}>
          Back
        </Button>
        <Button
          onClick={hasSignedAgreement ? () => nextStep() : () => formik.handleSubmit()}
          loadingMessage="Signing"
          loading={isSigningTransaction || isSending}
          disabled={isSigningTransaction || isSending}
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
