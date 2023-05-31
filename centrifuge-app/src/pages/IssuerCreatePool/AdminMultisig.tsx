import { useWallet } from '@centrifuge/centrifuge-react'
import { Button } from '@centrifuge/fabric'
import { useFormikContext } from 'formik'
import { CreatePoolValues } from '.'
import { PageSection } from '../../components/PageSection'
import { MultisigForm } from '../IssuerPool/Access/MultisigForm'

export function AdminMultisigSection() {
  const form = useFormikContext<CreatePoolValues>()
  const {
    substrate: { selectedAddress },
  } = useWallet()
  const { adminMultisigEnabled } = form.values

  return (
    <PageSection
      title="Pool Managers"
      headerRight={
        adminMultisigEnabled ? (
          <Button variant="secondary" small onClick={() => form.setFieldValue('adminMultisigEnabled', false)}>
            Disable
          </Button>
        ) : (
          <Button
            variant="secondary"
            small
            onClick={() => {
              form.setFieldValue('adminMultisig', {
                signers: [selectedAddress],
                threshold: 1,
              })
              form.setFieldValue('adminMultisigEnabled', true)
            }}
          >
            Enable
          </Button>
        )
      }
    >
      {adminMultisigEnabled && <MultisigForm isEditing canRemoveFirst={false} />}
    </PageSection>
  )
}
