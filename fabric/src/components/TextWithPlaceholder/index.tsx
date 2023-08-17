import * as React from 'react'
import styled, { css } from 'styled-components'
import { Placeholder } from '../Placeholder'
import { Text, TextProps } from '../Text'

const Loading = styled(Placeholder)`
  display: inline;
  background-size: 200% 80%;
  border-radius: 0.4em;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  word-break: break-word;
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

export type TextWithPlaceholderProps = TextProps &
  React.PropsWithChildren<{
    words?: number
    maxLines?: number
    variance?: number
    width?: number
    isLoading?: boolean
  }>

export const TextWithPlaceholder: React.FC<TextWithPlaceholderProps> = ({
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
            <Text key={i}>
              <Loading as="span">{getWord(width + Math.round((((rand * 10 ** i) % 1) - 0.5) * variance * 2))}</Loading>{' '}
            </Text>
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
