import { Box, Grid, Stack, Text } from '@centrifuge/fabric'
import styled from 'styled-components'
import { DAO } from '../utils/useDAOConfig'

export const Resolutions = ({ dao }: { dao: DAO }) => {
  return (
    <Grid columns={[1, 2, 4, 4]} equalColumns gap={3} alignItems="start">
      {dao.resolutions.map((blog) => (
        <HoverableCard
          as="a"
          href={blog.link}
          key={blog.title}
          border="1px solid"
          borderColor="borderPrimary"
          target="_blank"
          rel="noopener noreferrer"
          borderRadius="8px"
          height={480}
        >
          <Box
            width="100%"
            height={180}
            style={{
              backgroundImage: `url(${blog.image})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          />
          <Box mx={2} mt={2}>
            <Text style={{ marginBottom: 16 }} variant="body2">
              {blog.title.length > 80 ? `${blog.title.slice(0, 80)}...` : blog.title}
            </Text>
            <Text style={{ marginBottom: 16 }} variant="body4" color="textSecondary">
              {new Date(blog.timestamp * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text variant="body3" color="textSecondary">
              {blog.excerpt}
            </Text>
          </Box>
        </HoverableCard>
      ))}
    </Grid>
  )
}

const HoverableCard = styled(Stack)`
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.cardInteractive};
  }
`
