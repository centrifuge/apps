# Centrifuge Design System UI package

<style>
   .red-banner {
      padding: 1rem;
      border: 1px solid red;
      border-radius: 4px;
      color: red;
      background-color: rgba(255,0,0,.1);
   }
</style>
<p class="red-banner">
This package is temporarily named `ui-lib` and it's waiting for better naming. It will sit in its own branch and won't be merged in main until an official name has been decided.
</p>

## TODO

- Linter - formatter
- Testing (Storybook + Loki for Visual Regression Tests)

## Integration in the monorepo

- Make sure the same version of `react` and `styled-components` is used (at moment of writing: `styled-components@5.3.1`)
- Add the package directory in `apps/package.json` under the `workspaces` prop
- Declare the module in `apps/tinlake-ui/declarations.d.ts`
- Add the dependency to `apps/tinlake-ui/package.json`:
  ```
  "@centrifuge/ui-lib": "workspace:*",
  ```
- Change the `build:deps` script in `apps/tinlake-ui/package.json`:
  - from
    ```
    "build:deps": "cd ../tinlake.js && yarn build && cd ../tinlake-ui"
    ```
  - to
    ```
    "build:deps:tinlake.js": "cd ../tinlake.js && yarn build && cd ../tinlake-ui",
    "build:deps:ui-lib": "cd ../ui-lib && yarn build && cd ../tinlake-ui",
    "build:deps": "yarn build:deps:tinlake.js && yarn build:deps:ui-lib"
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
