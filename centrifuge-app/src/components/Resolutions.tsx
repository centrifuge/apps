import { Shelf, Stack, Text } from '@centrifuge/fabric'
import styled from 'styled-components'
import { DAO } from '../utils/useDAOConfig'
import { LayoutSection } from './LayoutBase/LayoutSection'

export const Resolutions = ({ dao }: { dao: DAO }) => {
  return (
    <LayoutSection title="Resolutions">
      <Shelf alignItems="flex-start" gap={3}>
        {dao.resolutions.map((blog) => (
          <HoverableCard
            width="282px"
            height="400px"
            as="a"
            href={blog.link}
            key={blog.title}
            gap="10px"
            border="1px solid"
            borderColor="borderPrimary"
            p={1}
            pb={3}
            target="_blank"
            rel="noopener noreferrer"
            borderRadius="4px"
          >
            <img src={blog.image} alt={blog.title} width="100%" height="auto" />
            <Text variant="body2">{blog.title}</Text>
            <Text variant="body4" color="textSecondary">
              {new Date(blog.timestamp * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text variant="body3" color="textSecondary">
              {blog.excerpt}
            </Text>
          </HoverableCard>
        ))}
      </Shelf>
    </LayoutSection>
  )
}

const HoverableCard = styled(Stack)`
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.cardInteractive};
  }
`
