import * as React from 'react'
import { Dialog } from '.'
import { Button } from '../Button'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

export default {
  title: 'Components/Dialog',
}

export const Default: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog isOpen={open} onClose={() => setOpen(false)}>
        <Stack gap={3}>
          <Text variant="heading2" as="h2">
            Example dialog body
          </Text>
          <Text variant="body1">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam sapiente tempore ipsa. Aliquid modi amet
            obcaecati eligendi nesciunt reiciendis voluptatem atque vel! Natus a non voluptates dolorum! Nobis, nostrum
            accusamus?
          </Text>
          <Shelf ml="auto" gap={1}>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setOpen(false)}>Also close</Button>
          </Shelf>
        </Stack>
      </Dialog>
    </>
  )
}
