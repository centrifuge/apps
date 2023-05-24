import { Button, Checkbox, Dialog, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import * as React from 'react'
import { boolean, object } from 'yup'
import { ActionBar, Content, ContentHeader } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { OnboardingUser } from '../../types'
import { useVerifyAccreditation } from './queries/useVerifyAccreditation'

const validationSchema = object({
  isAccredited: boolean().oneOf([true], 'You must confirm that you are an accredited investor'),
})

export const ConfirmAccreditationDialog = ({
  open,
  onClose,
  confirm,
}: {
  open: boolean
  onClose: () => void
  confirm: () => void
}) => {
  return (
    <Dialog isOpen={open} onClose={onClose} width="684px">
      <Stack gap={3}>
        <Text variant="heading2">Accredited investor</Text>
        <Text>I confirm that I am an accredited investor</Text>
        <Shelf gap={2}>
          <Button onClick={confirm}>Confirm</Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </Shelf>
      </Stack>
    </Dialog>
  )
}

export const Accreditation = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const { onboardingUser, previousStep, nextStep } = useOnboarding<NonNullable<OnboardingUser>>()

  const isCompleted = !!onboardingUser.globalSteps.verifyAccreditation?.completed

  const { mutate: verifyAccreditation, isLoading } = useVerifyAccreditation()

  const formik = useFormik({
    initialValues: {
      isAccredited: isCompleted,
    },
    validationSchema,
    onSubmit: () => {
      verifyAccreditation()
    },
  })

  return (
    <>
      <ConfirmAccreditationDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        confirm={formik.handleSubmit}
      />
      <Content>
        <ContentHeader
          title="Accredited investor assessment"
          body="Following is the criteria for being an accredited investor, as per the SEC publications:"
        />

        <Stack as="ul" gap={2} style={{ listStyle: 'disc' }}>
          <Text as="li" variant="body1">
            An annual income of $200,000 or greater ($300,000 in case of joint partners with a spouse) and proof of
            maintaining the same yearly
          </Text>
          <Text as="li" variant="body1">
            Net worth greater than $1 million either as a sole owner or with a joint partner, excluding residence
          </Text>
          <Text as="li" variant="body1">
            In the case of a trust, a total of $5 million in assets is required
          </Text>
          <Text as="li" variant="body1">
            An organization with all shareholders being accredited investors
          </Text>
        </Stack>

        <Checkbox
          {...formik.getFieldProps('isAccredited')}
          label={
            <Text style={{ cursor: 'pointer', paddingLeft: '12px' }}>I confirm that I am an accredited investor</Text>
          }
          disabled={isCompleted || isLoading}
          errorMessage={formik.errors.isAccredited}
          checked={formik.values.isAccredited}
        />
      </Content>

      <ActionBar>
        <Button onClick={() => previousStep()} variant="secondary" disabled={isLoading}>
          Back
        </Button>
        <Button
          onClick={() => {
            isCompleted ? nextStep() : setIsDialogOpen(true)
          }}
          disabled={isLoading}
          loading={isLoading}
          loadingMessage="Verifying"
        >
          Next
        </Button>
      </ActionBar>
    </>
  )
}
