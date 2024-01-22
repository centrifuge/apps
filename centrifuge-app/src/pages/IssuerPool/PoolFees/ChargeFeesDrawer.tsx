import { Drawer, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { useLocation } from 'react-router'
import { LabelValueStack } from '../../../components/LabelValueStack'
import { CopyToClipboard } from '../../../utils/copyToClipboard'
import { formatBalanceAbbreviated } from '../../../utils/formatting'

type ChargeFeesProps = {
  onClose: () => void
  isOpen: boolean
}

export const ChargeFeesDrawer = ({ onClose, isOpen }: ChargeFeesProps) => {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const chargeType = params.get('charge')

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <Stack gap={3}>
        <Text textAlign="center" variant="heading2">
          Charge {chargeType} fee
        </Text>
        <Shelf gap={3} alignItems="flex-start" justifyContent="flex-start">
          <LabelValueStack label="Type" value={chargeType} />
          <LabelValueStack label="Pending fees" value={formatBalanceAbbreviated(0, 'USD', 2)} />
          <LabelValueStack label={'Limit'} value={'1% of NAV'} />
          <LabelValueStack label={'Receiving address'} value={<CopyToClipboard address="0x12332...wedsd" />} />
        </Shelf>
      </Stack>
    </Drawer>
  )
}
