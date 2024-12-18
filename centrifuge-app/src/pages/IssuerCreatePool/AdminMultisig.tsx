import { useWallet } from '@centrifuge/centrifuge-react'
import { Button } from '@centrifuge/fabric'
import { useFormikContext } from 'formik'
import { PageSection } from '../../components/PageSection'
import { MultisigForm } from '../IssuerPool/Access/MultisigForm'
import { CreatePoolValues } from './types'

export function AdminMultisigSection() {
  const form = useFormikContext<CreatePoolValues>()
  const {
    substrate: { selectedAddress },
  } = useWallet()
  const { adminMultisigEnabled } = form.values

  return (
    <PageSection
      title="Pool managers"
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
