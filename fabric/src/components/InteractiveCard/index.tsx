import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { IconChevronDown, IconChevronRight, IconChevronUp } from '../../icon'
import { Box } from '../Box'
import { VisualButton } from '../Button'
import { Card, CardProps } from '../Card'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

export type InteractiveCardProps = {
  variant?: 'collabsible' | 'button' | 'default'
  icon?: React.ReactNode
  title: React.ReactNode
  titleAddition?: React.ReactNode
  secondaryHeader?: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export const InteractiveCard: React.FC<InteractiveCardProps & Omit<CardProps, 'variant'>> = ({
  variant = 'default',
  icon,
  title,
  titleAddition,
  secondaryHeader,
  children,
  onClick,
  ...rest
}) => {
  const [hovered, setHovered] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const theme = useTheme()

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (variant === 'collabsible') {
      setOpen((prev) => !prev)
    }
    if (onClick) onClick(e)
  }

  return (
    <Card variant={variant === 'default' ? 'default' : 'interactive'} {...rest}>
      <Header
        p={2}
        as={variant !== 'default' ? 'button' : 'div'}
        type="button"
        onClick={handleClick}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        justifyContent="space-between"
        width="100%"
      >
        <Shelf gap={1}>
          {icon}
          <Shelf gap={1} rowGap={0} alignItems="baseline" flexWrap="wrap">
            <Text variant="heading2" color={variant === 'default' ? 'textPrimary' : 'textInteractive'}>
              {title}
            </Text>
            <Text variant="body2">{titleAddition}</Text>
          </Shelf>
        </Shelf>
        <Box my="-10px">
          <VisualButton
            variant="text"
            active={hovered}
            icon={
              variant === 'default'
                ? undefined
                : variant === 'button'
                ? IconChevronRight
                : open
                ? IconChevronUp
                : IconChevronDown
            }
          />
        </Box>
      </Header>
      {secondaryHeader && (
        <Box
          p={2}
          style={{
            boxShadow: `0 -1px 0 ${theme.colors.borderSecondary}`,
          }}
        >
          {secondaryHeader}
        </Box>
      )}
      {(variant !== 'collabsible' || open) && (
        <Box
          p={2}
          backgroundColor={variant === 'collabsible' ? 'backgroundSecondary' : undefined}
          borderBottomLeftRadius="card"
          borderBottomRightRadius="card"
          style={{
            boxShadow: `0 -1px 0 ${theme.colors.borderSecondary}`,
          }}
        >
          {children}
        </Box>
      )}
    </Card>
  )
}

const Header = styled(Shelf)`
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
`
