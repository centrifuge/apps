import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Checkbox, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useMutation, useQuery } from 'react-query'
import { switchMap, tap } from 'rxjs'
import { useAuth } from '../../components/AuthProvider'
import { useOnboardingUser } from '../../components/OnboardingUserProvider'
import { PDFViewer } from '../../components/PDFViewer'

type Props = {
  nextStep: () => void
  backStep: () => void
  signedAgreementUrl: string | undefined
  isSignedAgreementFetched: boolean
}

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

export const SignSubscriptionAgreement = ({
  nextStep,
  backStep,
  signedAgreementUrl,
  isSignedAgreementFetched,
}: Props) => {
  const [isAgreed, setIsAgreed] = React.useState(false)
  const { authToken } = useAuth()
  const { refetchOnboardingUser, onboardingUser } = useOnboardingUser()
  const [transactionHash, setTransactionHash] = React.useState<string>()

  const isCompleted = onboardingUser?.steps?.signAgreements[poolId]?.[trancheId]?.signedDocument

  React.useEffect(() => {
    if (isCompleted) {
      setIsAgreed(true)
    }
  }, [isCompleted])

  const { data: unsignedAgreementData, isFetched: isUnsignedAgreementFetched } = useQuery(
    ['unsignedSubscriptionAgreement', poolId, trancheId],
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getUnsignedAgreement?poolId=${poolId}&trancheId=${trancheId}`,
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
    'Update configuration',
    (cent) => () => {
      return cent.getApi().pipe(
        switchMap((api) =>
          cent.wrapSignAndSend(
            api,
            api.tx.system.remark(`Signed subscription agreement for pool: ${poolId} tranche: ${trancheId}`)
          )
        ),
        tap((result) => {
          // @ts-expect-error
          if (result?.txHash) {
            // @ts-expect-error
            setTransactionHash(result.txHash.toHex())
          }
        })
      )
    },
    {
      onSuccess: () => {
        refetchOnboardingUser()
        nextStep()
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
          poolId,
          trancheId,
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

  const { mutate: storeTransactionHash } = useMutation(async (hash: string) => {
    const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/storeTransactionHash`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        poolId,
        trancheId,
        transactionHash: hash,
      }),
      credentials: 'include',
    })
    return response.json()
  })

  React.useEffect(() => {
    if (transactionHash) {
      storeTransactionHash(transactionHash)
    }
  }, [transactionHash, storeTransactionHash])

  const isAgreementFetched = React.useMemo(
    () => isUnsignedAgreementFetched || isSignedAgreementFetched,
    [isSignedAgreementFetched, isUnsignedAgreementFetched]
  )

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
          onClick={isCompleted ? () => nextStep() : () => signForm()}
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
