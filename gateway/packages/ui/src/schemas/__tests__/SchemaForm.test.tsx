import { mount, shallow } from 'enzyme'
import React from 'react'
import { Paragraph, TextArea } from 'grommet'
import { withAxis } from '../../test-utilities/test-providers'
import SchemaForm from '../SchemaForm'
import { Schema } from '@centrifuge/gateway-lib/models/schema'

describe('Schema Form', () => {
  const onSubmit = jest.fn(() => {})

  const onDiscard = jest.fn(() => {})

  beforeEach(() => {
    onSubmit.mockClear()
    onDiscard.mockClear()
  })

  const info = 'Some custom information'
  const submitLabel = 'Custom submit'

  it('should render the Schema form with default values', async () => {
    const schema = Schema.getDefaultValues()

    const component = mount(
      withAxis(
        <SchemaForm
          selectedSchema={schema}
          submitLabel={submitLabel}
          infoParagraph={info}
          readonly={false}
          onDiscard={onDiscard}
          onSubmit={onSubmit}
        />
      )
    )

    expect(component.find(Paragraph).text()).toEqual(info)
    expect(component.find({ label: submitLabel }).find('button').length).toEqual(1)
    expect(component.find(TextArea).prop('defaultValue')).toEqual(Schema.toEditableJson(schema))
  })

  it('should not submit the form because of form validation', async () => {
    const schema = Schema.getDefaultValues()
    const component = mount(
      withAxis(
        <SchemaForm
          selectedSchema={schema}
          submitLabel={submitLabel}
          infoParagraph={info}
          readonly={false}
          onDiscard={onDiscard}
          onSubmit={onSubmit}
        />
      )
    )

    const submit = component.find({ label: submitLabel }).find('button')
    submit.simulate('submit')
    expect(onSubmit).toHaveBeenCalledTimes(0)
  })

  it('should  submit the form', async () => {
    const schema: any = {
      name: 'TestAssetNFT',
      attributes: [
        {
          name: 'reference_id',
          label: 'Reference ID',
          type: 'string',
        },
      ],
      registries: [
        {
          label: 'TestAssetNFT',
          address: '0xc2c202c512786742A6A5C85C071ed140d03eF87c',
          asset_manager_address: '0x75d05e5a0EC4c6424b093c89425f1443991daf09',
          oracle_address: '0x75d05e5a0EC4c6424b093c89425f1443991daf09',
          proofs: ['cd_tree.attributes[0xe24e7917d4fcaf79095539ac23af9f6d5c80ea8b0d95c9cd860152bff8fdab17].byte_val'],
        },
      ],
      formFeatures: {
        fundingAgreement: false,
        columnNo: 2,
        comments: true,
        defaultSection: 'Attributes',
      },
    }

    schema.name = 'test-schema'

    const component = mount(
      withAxis(
        <SchemaForm
          selectedSchema={schema}
          submitLabel={submitLabel}
          infoParagraph={info}
          readonly={false}
          onDiscard={onDiscard}
          onSubmit={onSubmit}
        />
      )
    )

    const submit = component.find({ label: submitLabel }).find('button')
    submit.simulate('submit')
    await new Promise((r) => setTimeout(r, 0))
    expect(onSubmit).toHaveBeenCalledWith({
      _id: undefined,
      ...schema,
    })
  })

  it('should discard the form', async () => {
    const schema = Schema.getDefaultValues()
    const component = mount(
      withAxis(
        <SchemaForm
          selectedSchema={schema}
          submitLabel={submitLabel}
          infoParagraph={info}
          readonly={false}
          onDiscard={onDiscard}
          onSubmit={onSubmit}
        />
      )
    )

    const discard = component.find({ label: 'Discard' }).find('button')
    discard.simulate('click')
    expect(onDiscard).toHaveBeenCalledTimes(1)
  })

  it('Should have all fields disabled in readonly/view mode', async () => {
    const schema = Schema.getDefaultValues()

    const component = mount(
      withAxis(
        <SchemaForm
          selectedSchema={schema}
          submitLabel={submitLabel}
          infoParagraph={info}
          readonly={true}
          onDiscard={onDiscard}
          onSubmit={onSubmit}
        />
      )
    )
    expect(component.find({ readOnly: true }).find(TextArea).length).toBe(1)
  })
})
