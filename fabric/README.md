# fabric - Centrifuge Design System UI package

This package contains the implementation of the Centrifuge design system. It is home to:

- Color definitions
- Spacing units
- Icon components
- UI components (e.g. buttons, input controls, panels etc.)

## Getting started

To start using Fabric, install the package and its peer dependencies:

```bash
# yarn
yarn add @centrifuge/fabric react react-dom styled-components

# npm
npm install --save @centrifuge/fabric react react-dom styled-components
```

Import the `GlobalStyle` component, a theme, and `styled-components` `ThemeProvider` component, and add them to the root of your React app.

```jsx
import { GlobalStyle } from '@centrifuge/fabric'
import centrifugeLight from '@centrifuge/fabric/dist/theme/centrifugeLight'
import { ThemeProvider } from 'styled-components'

function App() {
  return (
    <ThemeProvider theme={centrifugeLight}>
      <GlobalStyle />
      {/* Rest of your React app */}
    </ThemeProvider>
  )
}
```

## Integration in the monorepo

- Make sure the same version of `react` and `styled-components` is used (at moment of writing: `styled-components@5.3.1`)
- Add the package directory in `apps/package.json` under the `workspaces` prop
- Declare the module in `apps/tinlake-ui/declarations.d.ts`
- Add the dependency to `apps/tinlake-ui/package.json`:
  ```
  "@centrifuge/fabric": "workspace:*",
  ```
- Change the `build:deps` script in `apps/tinlake-ui/package.json`:
  - from
    ```
    "build:deps": "cd ../tinlake.js && yarn build && cd ../tinlake-ui"
    ```
  - to
    ```
    "build:deps:tinlake.js": "cd ../tinlake.js && yarn build && cd ../tinlake-ui",
    "build:deps:fabric": "cd ../fabric && yarn build && cd ../tinlake-ui",
    "build:deps": "yarn build:deps:tinlake.js && yarn build:deps:fabric"
    ```

## Development

### With Storybook

```sh
$ yarn storybook
```

Will start the Storybook to allow development of the components in isolation

### Watch mode

```sh
$ yarn build --watch
```

Will build locally and listen for changes, allowing to see the changes directly when working on `tinlake-ui`, for example

### Publishing a new version

Create a new branch and run `yarn bump`, which bumps the package version, updates the changelog, creates a commit and tags it. Push the branch/tag, which should publish the version to NPM. Open a PR to merge the changes to `main`. For generating the changelog, make sure to use the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) spec in your commits, with `fabric` as the scope, e.g.: `feat(fabric): Add button component`
