import { Box, Drop } from 'grommet'
import React from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
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
`

const InnerMenu = styled(Box)`
  padding: 16px;
`

const Title = styled.div`
  color: #979797;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  margin-bottom: 4px;
`

const MenuItem = styled.a`
  display: flex;
  flex-direction: row;
  padding: 12px 0 4px 0;
  cursor: pointer;
  color: #000;

  &:hover {
    color: #0828be !important;
  }

  &:visited {
    color: #000;
  }
`

const Icon = styled.div`
  margin-right: 12px;
  width: 24px;
  height: 24px;
`

const Name = styled.div`
  text-decoration: underline;
`

const HelpMenu: React.FC<{}> = () => {
  const ref = React.useRef<HTMLDivElement>(null)

  const [justClosed, setJustClosed] = React.useState<boolean>(false)
  const [open, setOpen] = React.useState(false)

  const onClickOutside = () => {
    if (open) {
      setJustClosed(true)
      setOpen(false)
      setTimeout(() => setJustClosed(false), 0)
    }
  }

  return (
    <>
      <Wrapper
        ref={ref}
        onClick={() => {
          if (!justClosed) {
            setOpen(true)
          }
        }}
      >
        ?
      </Wrapper>
      {open && ref.current && (
        <Drop
          style={{ margin: '0 40px 110px auto', width: '240px' }}
          align={{ bottom: 'bottom', right: 'right' }}
          stretch={false}
          responsive
          target={ref.current}
          onClickOutside={onClickOutside}
          onEsc={() => setOpen(false)}
        >
          <InnerMenu width="240px" elevation="small" round="xsmall" background="white">
            <Title>Need help?</Title>
            <MenuItem href="https://centrifuge.io/slack/" target="_blank">
              <Icon>
                <img src="/static/help/slack.svg" />
              </Icon>
              <Name>Slack</Name>
            </MenuItem>
            <MenuItem href="https://t.me/centrifuge_chat" target="_blank">
              <Icon>
                <img src="/static/help/telegram.svg" />
              </Icon>
              <Name>Telegram</Name>
            </MenuItem>
            <MenuItem href="mailto:hello@centrifuge.io" target="_blank">
              <Icon>
                <img src="/static/help/email.svg" />
              </Icon>
              <Name>Email</Name>
            </MenuItem>
            {/* <MenuItem>
              <Icon>
                <img src="/static/help/slack.svg" />
              </Icon>
              <Name>FAQ</Name>
            </MenuItem> */}
            <MenuItem href="https://developer.centrifuge.io/" target="_blank">
              <Icon>
                <img src="/static/help/documentation.svg" />
              </Icon>
              <Name>Documentation</Name>
            </MenuItem>
          </InnerMenu>
        </Drop>
      )}
    </>
  )
}

export default HelpMenu
