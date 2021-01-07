import styled from 'styled-components'
export const ChartTooltip = styled.div`
  padding: 12px 16px;
  font-size: 12px;
  background: #000;
  opacity: 0.9;
  color: #fff;
  width: 220px;
`

export const ChartTooltipTitle = styled.div`
  font-weight: bold;
`

export const ChartTooltipLine = styled.div`
  display: flex;
  flex-direction: row;
  margin: 6px 0;
`

export const ChartTooltipColor = styled.div<{ color?: string }>`
  width: 8px;
  height: 8px;
  border-radius: 100%;
  background: ${(props) => props.color};
  display: inline-block;
  margin-right: 8px;
`

export const ChartTooltipKey = styled.div`
  flex: 1;
`
export const ChartTooltipValue = styled.div`
  flex: 1;
  text-align: right;
`
