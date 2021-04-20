# `ui`

## Dev

To run the UI only against the deployed gateway server, adjust the `proxy` in `packages/ui/package.json` to that endpoint. For the production gateway, you would set:

```
"proxy": "https://gateway.centrifuge.io"
```

Then:

```
cd packages/ui
NODE_ENV=production REACT_APP_AUTO_LOGIN=false yarn start
```
