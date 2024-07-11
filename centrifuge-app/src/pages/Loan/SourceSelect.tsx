import { ActiveLoan, Loan } from '@centrifuge/centrifuge-js'
import { Select, Text } from '@centrifuge/fabric'
import { nftMetadataSchema } from '../../schemas'
import { useLoans } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useBorrower } from '../../utils/usePermissions'
import { isExternalLoan } from './utils'

export function SourceSelect({
  loan,
  value,
  onChange,
}: {
  loan: Loan
  value: string
  onChange: (option: string) => void
}) {
  const unfilteredLoans = useLoans(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)

  const loans = unfilteredLoans?.filter(
    (l) =>
      l.id !== loan.id &&
      l.status === 'Active' &&
      (l as ActiveLoan).borrower === account?.actingAddress &&
      (isExternalLoan(loan) ? !isExternalLoan(l as Loan) : true)
  ) as Loan[] | undefined

  return (
    <Select
      label={<Text variant="heading3">Financing source</Text>}
      options={[
        { label: 'Reserve', value: 'reserve' },
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
