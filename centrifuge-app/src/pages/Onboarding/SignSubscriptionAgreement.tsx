import { useCentrifugeTransaction, useWallet } from '@centrifuge/centrifuge-react'
import { Box, Button, Checkbox, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useMutation, useQuery } from 'react-query'
import { switchMap } from 'rxjs'
import { useAuth } from '../../components/AuthProvider'
import { useOnboarding } from '../../components/OnboardingProvider'
import { PDFViewer } from '../../components/PDFViewer'

type Props = {
  nextStep: () => void
  backStep: () => void
  signedAgreementUrl: string | undefined
  isSignedAgreementFetched: boolean
}

export const SignSubscriptionAgreement = ({
  nextStep,
  backStep,
  signedAgreementUrl,
  isSignedAgreementFetched,
}: Props) => {
  const [isAgreed, setIsAgreed] = React.useState(false)
  const { authToken } = useAuth()
  const { refetchOnboardingUser, onboardingUser, pool } = useOnboarding()
  const { selectedAccount } = useWallet()

  const isCompleted =
    onboardingUser.steps.signAgreements[pool.id][pool.trancheId].signedDocument &&
    !!onboardingUser.steps.signAgreements[pool.id][pool.trancheId].transactionInfo.extrinsicHash

  React.useEffect(() => {
    if (isCompleted) {
      setIsAgreed(true)
    }
  }, [isCompleted])

  const { data: unsignedAgreementData, isFetched: isUnsignedAgreementFetched } = useQuery(
    ['unsignedSubscriptionAgreement', pool.id, pool.trancheId],
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getUnsignedAgreement?poolId=${pool.id}&trancheId=${
          pool.trancheId
        }`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      )

      const json = await response.json()

      const documentBlob = new Blob([Uint8Array.from(json.unsignedAgreement.data).buffer], {
        type: 'application/pdf',
      })

      return URL.createObjectURL(documentBlob)
    },
    {
      enabled: !isCompleted,
      refetchOnWindowFocus: false,
    }
  )

  const { execute: signRemark, isLoading: isSigningTransaction } = useCentrifugeTransaction(
    'sign remark',
    (cent) => () =>
      cent
        .getApi()
        .pipe(
          switchMap((api) =>
            cent.wrapSignAndSend(
              api,
              api.tx.system.remark(`Signed subscription agreement for pool: ${pool.id} tranche: ${pool.trancheId}`)
            )
          )
        ),
    {
      onSuccess: async (_, result) => {
        const extrinsicHash = result.txHash.toHex()
        // @ts-expect-error
        const blockNumber = result.blockNumber.toString()
        await sendDocumentsToIssuer({ extrinsicHash, blockNumber })
      },
    }
  )

  const { mutate: signForm, isLoading: isSigningAgreement } = useMutation(
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/signAgreement`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolId: pool.id,
          trancheId: pool.trancheId,
        }),
        credentials: 'include',
      })
      return response.json()
    },
    {
      onSuccess: () => {
        signRemark([])
      },
    }
  )

  const { mutate: sendDocumentsToIssuer } = useMutation(
    ['onboardingStatus', selectedAccount?.address, pool.id, pool.trancheId],
    async (transactionInfo: { extrinsicHash: string; blockNumber: string }) => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/sendDocumentsToIssuer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionInfo,
          trancheId: pool.trancheId,
          poolId: pool.id,
        }),
        credentials: 'include',
      })

      if (response.status === 201) {
        return response
      }
      throw response.statusText
    },
    {
      onSuccess: () => {
        refetchOnboardingUser()
        nextStep()
      },
    }
  )

  const isAgreementFetched = React.useMemo(
    () => isUnsignedAgreementFetched || isSignedAgreementFetched,
    [isSignedAgreementFetched, isUnsignedAgreementFetched]
  )

  const handleSubmit = () => {
    if (isCompleted) {
      nextStep()
    } else if (onboardingUser.steps.signAgreements[pool.id][pool.trancheId].signedDocument) {
      signRemark([])
    } else {
      signForm()
    }
  }

  return (
    <Stack gap={4}>
      <Box>
        <Text fontSize={5}>Sign subscription agreement</Text>
        <Text fontSize={2}>Complete subscription agreement</Text>
        {isAgreementFetched && (
          <Box overflowY="scroll" height="500px">
            <PDFViewer file={(signedAgreementUrl ? signedAgreementUrl : unsignedAgreementData) as string} />
          </Box>
        )}
      </Box>
      <Checkbox
        style={{
          cursor: 'pointer',
        }}
        checked={isCompleted || isAgreed}
        onChange={() => setIsAgreed((current) => !current)}
        label={<Text style={{ cursor: 'pointer' }}>I agree to the agreement</Text>}
        disabled={isSigningTransaction || isSigningAgreement || isCompleted}
      />
      <Shelf gap="2">
        <Button onClick={() => backStep()} variant="secondary" disabled={isSigningTransaction || isSigningAgreement}>
          Back
        </Button>
        <Button
          onClick={() => handleSubmit()}
          loadingMessage="Signing"
          loading={isSigningTransaction || isSigningAgreement}
          disabled={!isAgreed || isSigningTransaction || isSigningAgreement}
        >
          {isCompleted ? 'Next' : 'Sign'}
        </Button>
      </Shelf>
    </Stack>
  )
}
