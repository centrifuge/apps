import { Drop } from 'grommet'
import React from 'react'
import { preload } from '../../utils/images'
import { InnerMenu, MenuItem, Name, Title, Wrapper } from './styles'

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
          style={{ margin: '0 40px 60px auto', width: '220px', right: 0 }}
          stretch={false}
          responsive
          target={ref.current}
          onClickOutside={onClickOutside}
          onEsc={() => setOpen(false)}
        >
          <InnerMenu width="200px" elevation="small" round="xsmall" background="white">
            <Title>Need help?</Title>
            <MenuItem href="https://t.me/centrifuge_chat" target="_blank" icon="telegram">
              <Name>Telegram</Name>
            </MenuItem>
            <MenuItem href="https://centrifuge.io/discord" target="_blank" icon="slack">
              <Name>Discord</Name>
            </MenuItem>
            <MenuItem href="mailto:support@centrifuge.io" target="_blank" icon="email">
              <Name>Email</Name>
            </MenuItem>
            <MenuItem
              href="https://docs.centrifuge.io/tinlake/overview/introduction/"
              target="_blank"
              icon="documentation"
            >
              <Name>Documentation</Name>
            </MenuItem>
          </InnerMenu>
        </Drop>
      )}
    </>
  )
}

export default HelpMenu
