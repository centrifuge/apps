import { Box, Grid, Stack, Text } from '@centrifuge/fabric'
import styled from 'styled-components'
import { DAO } from '../utils/useDAOConfig'
import { LayoutSection } from './LayoutBase/LayoutSection'

export const Resolutions = ({ dao }: { dao: DAO }) => {
  return (
    <LayoutSection title="Resolutions">
      <Grid columns={[1, 2, 3, 4]} equalColumns gap={3} alignItems="start">
        {dao.resolutions.map((blog) => (
          <HoverableCard
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
            <Box background={`no-repeat 0% 0%/cover url(${blog.image})`} width="100%" height={180} />
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
      </Grid>
    </LayoutSection>
  )
}

const HoverableCard = styled(Stack)`
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.cardInteractive};
  }
`
