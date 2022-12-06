import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { IconChevronDown, IconChevronRight, IconChevronUp } from '../../icon'
import { Box } from '../Box'
import { VisualButton } from '../Button'
import { Card, CardProps } from '../Card'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

type OwnProps = {
  variant?: 'collapsible' | 'button' | 'default'
  icon?: React.ReactNode
  title: React.ReactNode
  titleAddition?: React.ReactNode
  subtitle?: React.ReactNode
  secondaryHeader?: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export type InteractiveCardProps = OwnProps & Omit<CardProps, 'variant'>

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  variant = 'default',
  icon,
  title,
  titleAddition,
  secondaryHeader,
  subtitle,
  children,
  onClick,
  ...rest
}) => {
  const [hovered, setHovered] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const theme = useTheme()

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (variant === 'collapsible') {
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
            <Stack>
              <Shelf gap={1} rowGap={0} alignItems="baseline" flexWrap="wrap">
                <Text variant="heading3" color={variant === 'default' ? 'textPrimary' : 'textInteractive'}>
                  {title}
                </Text>
                <Text variant="body2">{titleAddition}</Text>
              </Shelf>
              {subtitle && <Text variant="heading6">{subtitle}</Text>}
            </Stack>
          </Shelf>
        </Shelf>
        <Box my="-10px">
          <VisualButton
            variant="tertiary"
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
      {(variant !== 'collapsible' || open) && children && (
        <Box
          p={2}
          backgroundColor={variant === 'collapsible' ? 'backgroundSecondary' : undefined}
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
