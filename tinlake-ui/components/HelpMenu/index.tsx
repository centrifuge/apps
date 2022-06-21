import { Drop } from 'grommet'
import React from 'react'
import { preload } from '../../utils/images'
import { Card } from '../Card'
import { HelpMenuWrapper, MenuItem, Name, Title } from './styles'

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
      '/static/help/discord.svg',
      '/static/help/telegram.svg',
      '/static/help/email.svg',
      '/static/help/documentation.svg',
      '/static/help/discord-hover.svg',
      '/static/help/telegram-hover.svg',
      '/static/help/email-hover.svg',
      '/static/help/documentation-hover.svg',
    ])
    setHasPreloaded(true)
  }

  return (
    <>
      <HelpMenuWrapper
        onClick={() => {
          if (!justClosed) setOpen(!open)
          if (!hasPreloaded) loadImages()
        }}
      >
        <div ref={ref}>?</div>
      </HelpMenuWrapper>

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
          <Card width="200px" p="small">
            <Title>Need help?</Title>
            <MenuItem href="https://t.me/centrifuge_chat" target="_blank" icon="telegram">
              <Name>Telegram</Name>
            </MenuItem>
            <MenuItem href="https://centrifuge.io/discord" target="_blank" icon="discord">
              <Name>Discord</Name>
            </MenuItem>
            <MenuItem href="mailto:support@centrifuge.io" target="_blank" icon="email">
              <Name>Email</Name>
            </MenuItem>
            <MenuItem
              href="https://docs.centrifuge.io/"
              target="_blank"
              icon="documentation"
            >
              <Name>Documentation</Name>
            </MenuItem>
          </Card>
        </Drop>
      )}
    </>
  )
}

export default HelpMenu
