import * as React from 'react'
import styled from 'styled-components'
import { Stack } from '../Layout'
import { Props as ValueProps, Value } from '../Value'

interface Props extends ValueProps {
  label?: React.ReactNode
}

export const LabeledValue: React.FC<Props> = ({ variant, icon, value, unit, label }) => {
  return (
    <Stack gap="12px" alignItems="center">
      <Value variant={variant} value={value} icon={icon} unit={unit} />
      {label && <Label>{label}</Label>}
    </Stack>
  )
}

const Label = styled.div`
  text-align: center;
  font-weight: 500;
  font-size: 13px;
  line-height: 1;
  color: #979797;
`
