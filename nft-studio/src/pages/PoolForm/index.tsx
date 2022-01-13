import { Button, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { FileImageUpload } from '../../components/FileImageUpload'
import { RadioInput } from '../../components/RadioInput'
import { PageWithSideBar } from '../../components/shared/PageWithSideBar'
import { TextInput } from '../../components/TextInput'

export const PoolFormPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <CreatePoolForm />
    </PageWithSideBar>
  )
}

const ASSET_CLASS = [
  { label: 'Asset class 1', id: 'assetClass1' },
  { label: 'Asset class 2', id: 'assetClass2' },
  { label: 'Asset class 3', id: 'assetClass3' },
]

const CreatePoolForm: React.FC = () => {
  const [poolName, setPoolName] = React.useState<string>('')
  const [assetClass, setAssetClass] = React.useState<string>('')
  const [currency, setCurrency] = React.useState<string>('')
  const [discountRate, setDiscountRate] = React.useState<string>('')
  const [minEpochDuration, setMinEpochDuration] = React.useState<string>('')
  const [challengeTime, setChallengeTime] = React.useState<string>('')
  return (
    <Stack gap="3">
      <Shelf justifyContent="space-between">
        <TextInput
          label="Pool name"
          placeholder="Untitled pool"
          value={poolName}
          onChange={(ev) => {
            setPoolName(ev.target.value)
          }}
        />

        <Shelf gap="2">
          <Button variant="outlined">Cancel</Button>
          <Button variant="contained">Create</Button>
        </Shelf>
      </Shelf>

      <Stack gap="1">
        <Text variant="label1">Asset class</Text>
        <Shelf gap="4">
          {ASSET_CLASS.map(({ label, id }) => (
            <RadioInput
              key={id}
              label={label}
              checked={assetClass === id}
              name="assetClass"
              onChange={(ev) => {
                setAssetClass(id)
              }}
            />
          ))}
        </Shelf>
      </Stack>

      <Stack gap="1">
        <Text variant="label1">Pool icon</Text>
        <FileImageUpload onFileUpdate={() => {}} />
      </Stack>

      <Stack gap="1">
        <Text variant="label1">Issuer logo</Text>
        <FileImageUpload onFileUpdate={() => {}} />
      </Stack>

      <Select
        label="Currency"
        placeholder="Select..."
        options={[{ value: 'dai', label: 'DAI' }]}
        onSelect={(it) => {
          console.log('onSelect', it)
        }}
      />

      <TextInput
        label="Discount rate"
        placeholder="0.00%"
        value={discountRate}
        onChange={(ev) => {
          setDiscountRate(ev.target.value)
        }}
      />

      <Select
        label="Minimum epoch duration"
        placeholder="Select..."
        options={[{ value: '24h', label: '24 hours' }]}
        onSelect={(it) => {
          console.log('onSelect', it)
        }}
      />

      <Select
        label="Challenge time"
        placeholder="Select..."
        options={[{ value: '30m', label: '30 minutes' }]}
        onSelect={(it) => {
          console.log('onSelect', it)
        }}
      />
    </Stack>
  )
}
