import { ActiveLoan, Loan } from '@centrifuge/centrifuge-js'
import { Select } from '@centrifuge/fabric'
import { nftMetadataSchema } from '../../schemas'
import { useLoans } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useBorrower } from '../../utils/usePermissions'

type SourceSelectProps = {
  loan: Loan
  value: string
  onChange: (option: string) => void
  type: 'repay' | 'finance'
}

export function SourceSelect({ loan, value, onChange, type }: SourceSelectProps) {
  const unfilteredLoans = useLoans(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)

  const loans = unfilteredLoans?.filter(
    (l) =>
      l.id !== loan.id &&
      l.status === 'Active' &&
      (l as ActiveLoan).borrower === account?.actingAddress &&
      'valuationMethod' in l.pricing &&
      l.pricing.valuationMethod === 'cash'
  ) as Loan[] | undefined

  return (
    <Select
      label={type === 'finance' ? 'Source' : 'Destination'}
      options={[
        { label: 'Onchain reserve', value: 'reserve' },
        ...(loans?.map((l) => ({ value: l.id, label: <LoanOption loan={l as Loan} key={l.id} /> })) ?? []),
      ]}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function LoanOption({ loan }: { loan: Loan }) {
  const nft = useCentNFT(loan.asset.collectionId, loan.asset.nftId, false, false)
  const { data: metadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  return (
    <>
      {loan.id} - {metadata?.name}
    </>
  )
}
