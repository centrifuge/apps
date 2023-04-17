import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Button, NumberInput, Shelf, Stack, Text, TextInput } from '@centrifuge/fabric'
import { createKeyMulti, isAddress } from '@polkadot/util-crypto'
import { FieldArray, useFormikContext } from 'formik'
import { CreatePoolValues } from '.'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { useAddress } from '../../utils/useAddress'
import { address as validAddress, combine, integer, max, positiveNumber, required } from '../../utils/validation'

export function AdminMultisigSection() {
  const address = useAddress('substrate')
  const form = useFormikContext<CreatePoolValues>()
  const cent = useCentrifuge()
  const { adminMultisig, adminMultisigEnabled } = form.values
  const multiAddress = adminMultisig.signers.every((addr) => isAddress(addr))
    ? cent.utils.formatAddress(createKeyMulti([address!, ...adminMultisig.signers], adminMultisig.threshold))
    : null

  return (
    <FieldArray name="adminMultisig.signers">
      {(fldArr) => (
        <PageSection
          title="Admin multisig"
          headerRight={
            adminMultisigEnabled ? (
              <>
                <Button onClick={() => fldArr.push('')}>Add additional signer</Button>
                <Button onClick={() => form.setFieldValue('adminMultisigEnabled', false)}>Disable</Button>
              </>
            ) : (
              <Button onClick={() => form.setFieldValue('adminMultisigEnabled', true)}>Enable</Button>
            )
          }
        >
          {adminMultisigEnabled && (
            <>
              <Stack gap={2}>
                <Text>Multisig address: {multiAddress}</Text>
                {adminMultisig.signers.map((_, i) => (
                  <Shelf gap={1}>
                    <FieldWithErrorMessage
                      as={TextInput}
                      label="Address"
                      name={`adminMultisig.signers.${i}`}
                      validate={combine(required(), validAddress())}
                    />

                    {i > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        small
                        onClick={() => {
                          fldArr.remove(i)
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </Shelf>
                ))}
                <FieldWithErrorMessage
                  as={NumberInput}
                  name="adminMultisig.threshold"
                  label="Threshold"
                  type="number"
                  min="1"
                  max={adminMultisig.signers.length + 1}
                  validate={combine(integer(), positiveNumber(), max(adminMultisig.signers.length + 1))}
                />
              </Stack>
            </>
          )}
        </PageSection>
      )}
    </FieldArray>
  )
}
