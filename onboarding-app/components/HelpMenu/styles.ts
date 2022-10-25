import styled from 'styled-components'

export const HelpMenuWrapper = styled.div`
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 48px;
  height: 48px;
  border-radius: 100%;
  background: #0828be;
  color: #fff;
  font-size: 24px;
  text-align: center;
  box-shadow: 0px 2px 4px rgba(8, 40, 190, 0.3);
  cursor: pointer;
  padding-top: 6px;

  @media (max-width: 899px) {
    display: none;
  }
`

export const Title = styled.div`
  color: #979797;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  margin-bottom: 4px;
`

export const MenuItem = styled.a<{ icon?: string }>`
  display: flex;
  flex-direction: row;
  padding: 12px 0 4px 40px;
  cursor: pointer;
  color: #000;
  background-image: url('/static/help/${(props) => props.icon || 'email'}.svg');
  background-repeat: no-repeat;
  background-position: 2px 10px;

  &:hover {
    color: #0828be !important;
    background-image: url('/static/help/${(props) => props.icon || 'email'}-hover.svg');
  }

  &:visited {
    color: #000;
  }
`

export const Name = styled.div`
  text-decoration: underline;
`
