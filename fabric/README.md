# fabric - Centrifuge Design System UI package

This package contains the implementation of the Centrifuge design system. It is home to:

- Color definitions
- Spacing units
- Icon components
- UI components (e.g. buttons, input controls, panels etc.)

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

## Visual regression testing

This package uses [Loki](https://loki.js.org/) for visual regression testing.

To execute visual regression tests locally:

```sh
yarn storybook # starts storybook, needed for Loki locally to be able to operate on stories

yarn test
```

If the test fails (differences were spotted between the `reference` and `current` snapshots), the diff images will be
created in `.loki/difference`. If all the changes were expected, the reference snapshots can be approved:

```sh
yarn approve
```
