import { Box, Button, IconArrowLeft, IconX, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link, useHistory } from 'react-router-dom'
import { ButtonGroup } from '../components/ButtonGroup'
import { Dialog } from '../components/Dialog'
import { SplitView } from '../components/SplitView'
import { useWeb3 } from '../components/Web3Provider'
import { useNFT } from '../utils/useNFT'

export const NFTPage: React.FC = () => {
  const { selectedAccount } = useWeb3()
  const { data } = useNFT('1')
  const [transferOpen, setTransferOpen] = React.useState(false)
  const history = useHistory()

  return (
    <SplitView
      left={
        <Box display="flex" alignItems="center" justifyContent="center" py={8} height="100%">
          <Box as="img" maxHeight="80vh" src={data?.metadata.image} />
        </Box>
      }
      right={
        <Shelf
          py={8}
          gap={8}
          alignItems="flex-start"
          justifyContent="space-between"
          flexDirection={['column', 'row', 'column']}
        >
          <Box position="absolute" top={2} right={3}>
            <Button variant="text" icon={IconX} onClick={() => history.goBack()} />
          </Box>
          {data && (
            <>
              <Stack gap={3}>
                <Box display={['none', 'none', 'block']}>
                  <Link to={`/collection/${data.collection.id}`}>
                    <Text fontWeight={600}>
                      <u>{data.collection.name}</u>
                    </Text>
                  </Link>
                </Box>
                <Stack>
                  <Text variant="headingLarge" as="h1">
                    {data.metadata.name}
                  </Text>
                  <Text variant="heading3" color="textSecondary">
                    by {data.creator}
                  </Text>
                </Stack>
              </Stack>
              <Stack gap={3}>
                <Stack>
                  <Text variant="label1">Creation date</Text>
                  <Text variant="heading3">
                    {data &&
                      new Date(data.createdAt).toLocaleDateString('en', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                  </Text>
                </Stack>
                <Stack>
                  <Text variant="label1">Source</Text>
                  <Text
                    as="a"
                    href={data.metadata.image}
                    target="_blank"
                    variant="heading3"
                    style={{ wordBreak: 'break-all' }}
                  >
                    <u>{data.metadata.image}</u>
                  </Text>
                </Stack>
              </Stack>
              {(data.owner === selectedAccount?.address || true) && (
                <div>
                  <Button
                    onClick={() => setTransferOpen(true)}
                    icon={<IconArrowLeft size={16} style={{ transform: 'scaleX(-1' }} />}
                    variant="outlined"
                  >
                    Transfer
                  </Button>
                  <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} />
                </div>
              )}
            </>
          )}
        </Shelf>
      }
    />
  )
}

const TransferDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [address, setAddress] = React.useState('')
  return (
    <Dialog isOpen={open} onClose={onClose}>
      <Stack gap={3}>
        <Text variant="heading2" as="h2">
          Transfer NFT
        </Text>
        <Text variant="body2">You’re about to transfer your NFT to another user</Text>
        <input value={address} onChange={(e) => setAddress(e.target.value)} />
        <ButtonGroup>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!address}>Transfer</Button>
        </ButtonGroup>
      </Stack>
    </Dialog>
  )
}
