import { Meta, StoryFn } from '@storybook/react'
import * as React from 'react'
import { Accordion } from '.'

export default {
  title: 'Components/Accordion',
  component: Accordion,
} as Meta<typeof Accordion>

type AccordionStory = StoryFn<typeof Accordion>
const Template: AccordionStory = (args) => <Accordion {...args} />

export const Default = Template.bind({})
Default.args = {
  items: [
    {
      title: 'Sumary of terms',
      body: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.',
    },
    {
      title: 'Assets',
      body: 'Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi.',
    },
    {
      title: 'Credit underwriting',
      body: 'Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum.',
    },
  ],
}
