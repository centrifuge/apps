import * as React from 'react'
import styled, { css, keyframes } from 'styled-components'
import { Box } from '../Box'
import { Text, TextProps } from '../Text'

const load = keyframes`
  from {
	  background-position-x: 0;
  }
  to {
	  background-position-x: -200%;
  }
`

const Loading = styled(Box)<{ $isLoading: boolean }>`
  display: inline;
  --color1: ${({ theme }) => theme.colors.borderPrimary};
  --color2: ${({ theme }) => theme.colors.borderSecondary};
  background: linear-gradient(90deg, var(--color1), var(--color2), var(--color1));
  background-size: 200% 80%;
  background-position-y: 50%;
  background-repeat: repeat-x;
  border-radius: 0.4em;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  word-break: break-word;
  animation: ${load} 1.5s ease infinite;
`

const LoadingWrapper = styled.div<{ $lines: number; $isLoading: boolean }>`
  ${({ $lines, $isLoading }) =>
    $isLoading &&
    css`
      display: -webkit-box;
      -webkit-line-clamp: ${$lines};
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      color: transparent;
      -webkit-box-decoration-break: clone;
      box-decoration-break: clone;
    `};
`

type Props = TextProps &
  React.PropsWithChildren<{
    words?: number
    maxLines?: number
    variance?: number
    width?: number
    isLoading?: boolean
  }>

export const TextWithPlaceholder: React.FC<Props> = ({
  words = 1,
  maxLines = 3,
  variance = 2,
  width = 10,
  isLoading,
  children,
  ...textProps
}) => {
  const [rand] = React.useState(() => Math.random())
  return (
    <Text {...textProps} textOverflow="ellipsis" textDecoration={isLoading ? 'none' : textProps.textDecoration}>
      {isLoading ? (
        <LoadingWrapper $lines={maxLines} $isLoading={isLoading}>
          {Array.from({ length: words }, (_, i) => (
            <React.Fragment key={i}>
              <Text as={Loading}>{getWord(width + Math.round((((rand * 10 ** i) % 1) - 0.5) * variance * 2))}</Text>{' '}
            </React.Fragment>
          ))}
        </LoadingWrapper>
      ) : (
        children
      )}
    </Text>
  )
}

function getWord(width: number) {
  const word = Array.from({ length: Math.max(3, width) }, () => '0').join('')

  if (word.length < 16) return word

  return `${word.slice(0, -8)} ${word.slice(-8)}` // Push more characters to a new line if the word wraps, to avoid having a tiny bit of placeholder on a line
}
