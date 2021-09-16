import styled from 'styled-components'
import { Card } from '../Card'

export const Header = styled.div`
  padding: 0 16px;
  gap: 16px;
  display: flex;
`

export const PoolRow = styled(Card)`
  padding: 16px;
  text-decoration: none;
  transition: all 100ms linear 0s;

  @media (pointer: fine) {
    &:hover {
      box-shadow: rgba(0, 0, 0, 0.24) 0px 2px 6px;
      transform: scale(1.01);
    }
  }
`

export const Icon = styled.img`
  width: 40px;
  height: 40px;
`

export const Desc = styled.div`
  flex: 1 1 auto;
`

export const Name = styled.h3`
  margin: 0;
  font-weight: 500;
  font-size: 16px;
  line-height: 1.2;
  color: #333333;

  @media (max-width: 899px) {
    color: #0828be;
  }
`

export const Type = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.2;
  color: #777777;
`

export const HeaderCol = styled.div`
  width: 160px;
  text-align: right;
`

export const DataCol = styled(HeaderCol)`
  display: flex;
  justify-content: flex-end;
  align-self: center;
`

export const SubNumber = styled.span`
  display: block;
  font-weight: 500;
  font-size: 10px;
  color: #777777;
`

export const HeaderTitle = styled.h4`
  margin: 0;
  font-weight: 500;
  font-size: 16px;
  line-height: 1.5;
  color: #777;

  @media (max-width: 899px) {
    font-size: 14px;
  }
`

export const HeaderSub = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 11px;
  line-height: 1.2;
  color: #979797;
`

export const EmptyParagraph = styled.p`
  color: #0828be;
  font-size: 20px;
  line-height: 32px;
  font-weight: 500;
`
