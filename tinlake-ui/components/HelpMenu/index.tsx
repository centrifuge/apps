import { Box, Drop } from 'grommet'
import React from 'react'
import styled from 'styled-components'
import { preload } from '../../utils/images'

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

const MenuItem = styled.a<{ icon?: string }>`
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

  const [hasPreloaded, setHasPreloaded] = React.useState<boolean>(false)

  const loadImages = () => {
    preload([
      '/static/help/slack.svg',
      '/static/help/telegram.svg',
      '/static/help/email.svg',
      '/static/help/documentation.svg',
      '/static/help/slack-hover.svg',
      '/static/help/telegram-hover.svg',
      '/static/help/email-hover.svg',
      '/static/help/documentation-hover.svg',
    ])
    setHasPreloaded(true)
  }

  return (
    <>
      <Wrapper
        onClick={() => {
          if (!justClosed) setOpen(!open)
          if (!hasPreloaded) loadImages()
        }}
      >
        <div ref={ref}>?</div>
      </Wrapper>

      {open && ref.current && (
        <Drop
          align={{ bottom: 'bottom', right: 'right' }}
          style={{ margin: '0 40px 60px auto', width: '200px', right: 0 }}
          stretch={false}
          responsive
          target={ref.current}
          onClickOutside={onClickOutside}
          onEsc={() => setOpen(false)}
        >
          <InnerMenu width="200px" elevation="small" round="xsmall" background="white">
            <Title>Need help?</Title>
            <MenuItem href="https://centrifuge.io/slack/" target="_blank" icon="slack">
              <Name>Slack</Name>
            </MenuItem>
            <MenuItem href="https://t.me/CentrifugeSupport" target="_blank" icon="telegram">
              <Name>Telegram</Name>
            </MenuItem>
            <MenuItem href="mailto:support@centrifuge.io" target="_blank" icon="email">
              <Name>Email</Name>
            </MenuItem>
            {/* <MenuItem>
              <Name>FAQ</Name>
            </MenuItem> */}
            <MenuItem href="https://docs.centrifuge.io/" target="_blank" icon="documentation">
              <Name>Documentation</Name>
            </MenuItem>
          </InnerMenu>
        </Drop>
      )}
    </>
  )
}

export default HelpMenu
