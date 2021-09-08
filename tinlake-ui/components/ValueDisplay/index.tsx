import { ReactElement, ReactNode } from 'react'
import styled from 'styled-components'
import { Shelf, Stack } from '../Layout'
import { LoadingValue } from '../LoadingValue'

interface Props {
  icon?: ReactElement | string
  value?: ReactNode
  unit: string
  label?: ReactNode
}

export const ValueDisplay: React.FC<Props> = ({ icon, value, unit, label }) => {
  return (
    <Stack gap="xsmall" alignItems="center">
      <Shelf gap="xsmall">
        {typeof icon === 'string' ? <Icon src={icon} /> : icon}
        <LoadingValue done={value != null} width={75} height={28}>
          <Value>
            {value}&nbsp;<Unit>{unit}</Unit>
          </Value>
        </LoadingValue>
      </Shelf>
      {label && <Label>{label}</Label>}
    </Stack>
  )
}

const Value = styled.span`
  font-weight: 500;
  font-size: 24px;
  line-height: 1;
  color: #333;
`

const Unit = styled.span`
  font-size: 16px;
`

const Icon = styled.img`
  width: 24px;
  height: 24px;
`

const Label = styled.div`
  text-align: center;
  font-weight: 500;
  font-size: 13px;
  line-height: 1;
  color: #979797;
`
