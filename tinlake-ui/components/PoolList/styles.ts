import styled from 'styled-components'

export const Header = styled.div`
  padding: 16px;
  display: flex;
`

export const PoolRow = styled.div`
  padding: 16px;
  display: flex;
  border-radius: 8px;
  box-shadow: 0 2px 6px #00000030;
  background: white;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 100ms linear 0s;

  &:hover {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 2px 6px;
    transform: scale(1.01);
  }
`

export const Icon = styled.img`
  width: 40px;
  height: 40px;
  margin-right: 16px;
`

export const Desc = styled.div`
  flex: 1 1 auto;
`

export const Name = styled.h3`
  margin: 0;
  font-weight: 500;
  font-size: 16px;
  line-height: 28px;
  color: #333;
`

export const Type = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 13px;
  line-height: 14px;
  color: #979797;
`

export const HeaderCol = styled.div`
  width: 160px;
  margin-left: 16px;
  text-align: right;
`

export const DataCol = styled(HeaderCol)`
  align-self: center;
`

export const Number = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 28px;
  color: #333;
`

export const Unit = styled.span`
  font-weight: 500;
  font-size: 11px;
  line-height: 14px;
  color: #979797;
`

export const Dash = styled(Number)`
  color: #979797;
`

export const HeaderTitle = styled.h4`
  margin: 0;
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: #777;
`

export const HeaderSub = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 11px;
  line-height: 14px;
  color: #979797;
`

export const Label = styled.div<{ green?: true; blue?: true; orange?: true }>`
  margin-left: 13px;
  position: relative;
  top: -2px;
  display: inline-block;
  height: 20px;
  font-weight: 500;
  font-size: 12px;
  color: white;
  padding: 0 8px 0 8px;
  text-align: center;
  border-radius: 12px;
  border: 1px solid ${({ green, blue, orange }) => (green ? '#598232' : blue ? '#2976D4' : orange ? '#9B6F2B' : '#666')};
  color: ${({ green, blue, orange }) => (green ? '#598232' : blue ? '#2976D4' : orange ? '#9B6F2B' : '#666')};
`

export const EmptyParagraph = styled.p`
  color: #0828be;
  font-size: 20px;
  line-height: 32px;
  font-weight: 500;
`
