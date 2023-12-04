import * as React from 'react'
import { Drawer } from '.'
import { Button } from '../Button'
import { Stack } from '../Stack'
import { Text } from '../Text'

export default {
  title: 'Components/Drawer',
}

export const Default = () => {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer isOpen={open} onClose={() => setOpen(false)}>
        <Stack gap={3}>
          <Text variant="heading2" as="h2">
            Example drawer body
          </Text>
          <Text variant="body1">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam sapiente tempore ipsa. Aliquid modi amet
            obcaecati eligendi nesciunt reiciendis voluptatem atque vel! Natus a non voluptates dolorum! Nobis, nostrum
            accusamus?
          </Text>
        </Stack>
      </Drawer>
    </>
  )
}
