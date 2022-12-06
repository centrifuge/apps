# centrifuge-react - Centrifuge React library

This package contains React components and utilities, combining `centrifuge-js` and `fabric`

## Getting started

To start using this package, install the package and its peer dependencies:

```bash
# yarn
yarn add @centrifuge/centrifuge-react @centrifuge/centrifuge-js @centrifuge/fabric react react-dom styled-components

# npm
npm install --save @centrifuge/centrifuge-react @centrifuge/centrifuge-js @centrifuge/fabric react react-dom styled-components
```

Import the `Provider` component, Fabric's `FabricProvider` component and a theme, and add them to the root of your React app.

```jsx
import { Provider } from '@centrifuge/centrifuge-react'
import { FabricProvider, GlobalStyle, centrifugeLight } from '@centrifuge/fabric'
import centrifugeLight from '@centrifuge/fabric/dist/theme/centrifugeLight'

// Optionally override the config for CentrifugeJS
// Needs to me memoized, so as not to recreate an instance of CentrifugeJS each render
const config = {
  network: 'altair',
}

function App() {
  return (
    <Provider centrifugeConfig={config}>
      <FabricProvider theme={centrifugeLight}>
        <GlobalStyle />
        {/* Rest of your React app */}
      </FabricProvider>
    </Provider>
  )
}
```

## Development

### With Storybook

```sh
$ yarn storybook
```

Will start the Storybook to allow development of the components in isolation

### Watch mode

```sh
$ yarn start
```

Will build locally and listen for changes, allowing to see the changes directly when working on `centrifuge-app`, for example

### Publishing a new version

Create a new branch and run `yarn bump`, which bumps the package version, updates the changelog, creates a commit and tags it. Push the branch/tag, which should publish the version to NPM. Open a PR to merge the changes to `main`. For generating the changelog, make sure to use the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) spec in your commits, with `centrifuge-react` as the scope, e.g.: `feat(centrifuge-react): Add useCentrifugeQuery`
