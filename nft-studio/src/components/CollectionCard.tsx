import { Collection } from '@centrifuge/centrifuge-js'
import { Box, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { collectionMetadataSchema } from '../schemas'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useMetadata } from '../utils/useMetadata'
import { useVisibilityChecker } from '../utils/useVisibilityChecker'
import { Identity } from './Identity'
import { LogoAltair } from './LogoAltair'
import { TextWithPlaceholder } from './TextWithPlaceholder'

type Props = {
  collection: Collection
}

export const CollectionCard: React.FC<Props> = ({ collection }) => {
  const [visible, setVisible] = React.useState(false)
  const ref = React.useRef<HTMLAnchorElement>(null)

  useVisibilityChecker({ ref, onEnterOnce: () => setVisible(true), marginTop: 200 })

  const { data: metadata, isLoading } = useMetadata(
    visible ? collection.metadataUri : undefined,
    collectionMetadataSchema
  )
  const { id, admin, instances } = collection

  return (
    <CollectionCardInner
      to={`/collection/${id}`}
      title={metadata?.name || 'Unnamed collection'}
      label={
        <Shelf gap="4px">
          <span>by</span>
          <Identity address={admin} />
        </Shelf>
      }
      description={metadata?.description}
      image={metadata?.image}
      count={instances}
      isLoading={isLoading}
      ref={ref}
    />
  )
}

type InnerProps = {
  count?: number
  to: string
  title: string
  label?: React.ReactNode
  description?: string
  image?: string
  isLoading?: boolean
}

export const CollectionCardInner = React.forwardRef<HTMLAnchorElement, InnerProps>(
  ({ isLoading, count, to, title, label, description, image }, ref) => {
    const [imageShown, setImageShown] = React.useState(false)

    return (
      <Card as={Link} display="block" height="100%" to={to} variant="interactive" ref={ref}>
        <Stack>
          <Box
            bg="placeholderBackground"
            style={{ aspectRatio: '16/9' }}
            borderTopLeftRadius="card"
            borderTopRightRadius="card"
            overflow="hidden"
            position="relative"
          >
            {image && (
              <Box
                as="img"
                alt=""
                src={parseMetadataUrl(image)}
                display="block"
                width="100%"
                height="100%"
                position="relative"
                zIndex={1}
                style={{ objectFit: 'cover', transition: 'opacity 200ms', opacity: imageShown ? 1 : 0 }}
                onLoad={() => setImageShown(true)}
              />
            )}
            <Shelf
              justifyContent="center"
              position="absolute"
              width="100%"
              height="100%"
              top={0}
              left={0}
              zIndex={0}
              backgroundColor="black"
              style={{ transition: 'opacity 200ms', opacity: imageShown ? 0 : 1 }}
            >
              <LogoAltair height="50%" />
            </Shelf>

            {count != null ? (
              <Count px={1} py="4px" position="absolute" bottom={1} right={1} zIndex={1}>
                <Text variant="label2" color="textPrimary">
                  {count} NFTs
                </Text>
              </Count>
            ) : null}
          </Box>
          <Stack gap={2} py={[2, 3]} px={[3, 4]} alignItems="center">
            <Stack alignItems="center">
              <TextWithPlaceholder
                isLoading={isLoading}
                as="h2"
                variant="heading2"
                textAlign="center"
                style={{ wordBreak: 'break-word' }}
              >
                {title}
              </TextWithPlaceholder>
              {label && (
                <Text textAlign="center" variant="label1">
                  {label}
                </Text>
              )}
            </Stack>
            <TextWithPlaceholder
              isLoading={isLoading}
              width={70}
              variance={20}
              textAlign="center"
              style={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
              }}
            >
              {description}
            </TextWithPlaceholder>
          </Stack>
        </Stack>
      </Card>
    )
  }
)

const Count = styled(Box)`
  &::before {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
    opacity: 0.8;
    z-index: -1;
    border-radius: 2px;
  }
`
