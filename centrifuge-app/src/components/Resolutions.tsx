import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import styled from 'styled-components'
import aaveBlog from '../assets/images/aave-blog.png'

const blogs = [
  {
    title: '[ARFC] Aave Treasury RWA Allocation',
    date: ' Sep 7, 2023',
    author: 'Asad Khan',
    excerpt:
      'This proposal brings on Centrifuge as a service provider to the Aave DAO to setup a legal structure to support RWA investments, develop RWA specific management and governance processes, and allocate $1M of the Aave Treasury’s stablecoin holdings to a liquid US T-Bill fund on Centrifuge, as a proof of concept investment.',
    link: 'https://governance.aave.com/t/arfc-aave-treasury-rwa-allocation/14790',
  },
  {
    title: '[ARFC] Aave Treasury Proposal for RWA Allocation Snapshot Vote',
    date: 'Sep 12, 2023',
    author: 'Asad Khan',
    excerpt:
      'This is a first step towards a long term effort for Aave to develop and launch an RWA Facilitator that will back GHO with Real World Assets. With this proposal Aave can earn yield on idle stablecoins, establish long-term RWA infrastructure for the protocol, and allow the Aave DAO to begin building internal familiarity and expertise in the RWA industry.',
    link: 'https://snapshot.org/#/aave.eth/proposal/0x71db494e4b49e7533c5ccaa566686b2d045b0761cb3296a2d77af4b500566eb0',
  },
  {
    title: 'Draft Documents for Aave RWA Legal Structure',
    date: 'Oct 31, 2023',
    author: 'Asad Khan',
    excerpt:
      'We have developed an initial draft of the legal documents that will define the Aave’s DAO RWA legal structure. We have shared the below summary and documents with core contributors and delegates for feedback with no issues identified.',
    link: 'https://governance.aave.com/t/draft-documents-for-aave-rwa-legal-structure/15283',
  },
]

export const Resolutions = () => {
  return (
    <Stack as="article" gap={2}>
      <Text as="h2" variant="heading2">
        Resolutions
      </Text>
      <Shelf alignItems="flex-start" gap={3}>
        {blogs.map((blog) => (
          <HoverableCard
            width="282px"
            height="426px"
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
            <img src={aaveBlog} alt={blog.title} width="100%" height="auto" />
            <Text variant="body2">{blog.title}</Text>
            <Text variant="body4" color="textSecondary">
              {blog.date}
            </Text>
            <Text variant="body3" color="textSecondary">
              {blog.excerpt}
            </Text>
            <Shelf gap="10px">
              <Box height="19px" width="19px" borderRadius="100%" backgroundColor="yellowScale.100" />
              <Text variant="body2" color="textSecondary">
                {blog.author}
              </Text>
            </Shelf>
          </HoverableCard>
        ))}
      </Shelf>
    </Stack>
  )
}

const HoverableCard = styled(Stack)`
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.cardInteractive};
  }
`
