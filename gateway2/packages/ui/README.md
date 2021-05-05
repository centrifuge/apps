# `ui`

## Dev

To run the UI only against the deployed gateway server, adjust the `proxy` in `packages/ui/package.json` to that endpoint. For the production gateway, you would set:

```
"proxy": "https://gateway.centrifuge.io"
```

For the amber gateway, you would set:

```
"proxy": "https://gateway.amber.centrifuge.io"

Then:

```

cd packages/ui
NODE_ENV=production REACT_APP_AUTO_LOGIN=false yarn start

```

## Skip/disable two factor authentication 2FA

```

REACT_APP_DISABLE_2FA=true yarn start

```

## Automatically log in user

```

REACT_APP_ADMIN_USER=gateway@centrifuge.io REACT_APP_ADMIN_PASSWORD=admin yarn start

```

```
