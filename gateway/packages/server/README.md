# `server`

## Getting started

### Running locally

Run `cp .env.example .env`, generate JWT private/public keys as outlined below, and put the values into `.env`. Make sure to replace all line breaks with `\n`.

Gateway requires a Centrifuge Node to run. Either connect via VPN to a deployed node, or see [here](https://developer.centrifuge.io/cent-node/overview/introduction/), how to set-up and configure a Centrifuge Node and interact with it. If running your own node, make sure you configure the node's webhooks to call your future Gateway instance. By default this will be `localhost:3001/webhooks`.

#### Connect with deployed Amber node

```
NODE_ENV=development REACT_APP_DISABLE_2FA=true REACT_APP_ADMIN_USER=gateway@centrifuge.io REACT_APP_ADMIN_PASSWORD=admin ETH_NETWORK=kovan ETH_PROVIDER=https://kovan.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5 CENTRIFUGE_URL=http://35.246.189.215:8082 CENTRIFUGE_ADMIN_ACCOUNT=0x25C2583cd6a9E7B3dA312c4D7D6654E1456C95D9 JWT_PRIV_KEY=$(cat jwtRS256.key) JWT_PUB_KEY=$(cat jwtRS256.key.pub) yarn start
```

#### Connect with local node

```
NODE_ENV=development ETH_NETWORK=kovan ETH_PROVIDER=https://kovan.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5 CENTRIFUGE_URL=http://127.0.0.1:8082 CENTRIFUGE_ADMIN_ACCOUNT=0x0A735602a357802f553113F5831FE2fbf2F0E2e0 yarn start
```

### Test queries

```
curl -X POST http://localhost:3001/api/users/login -d '{"email": "gateway@centrifuge.io", "password": "admin"}' -H "Content-Type: application/json"
```

```
curl -X GET http://localhost:3001/api/users/profile -H "Content-Type: application/json"
```

```
curl -X GET http://localhost:3001/api/users/profile -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJnYXRld2F5QGNlbnRyaWZ1Z2UuaW8iLCJwb29sSWRzIjpbbnVsbCxudWxsXSwiaWF0IjoxNjE4NTcyOTUxLCJleHAiOjE2MTg1NzY1NTF9.0F6lnnIMk5b39Wuoq_JIvL1M1jUEO09pswPikw6R2No"
```

### Generate JWT private/public keys

Sources:

- https://gist.github.com/ygotthilf/baa58da5c3dd1f69fae9
- https://github.com/auth0/node-jsonwebtoken/issues/68

```
ssh-keygen -t rsa -P "" -b 2048 -m PEM -f jwtRS256.key
# Don't add passphrase
openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub
cat jwtRS256.key
cat jwtRS256.key.pub
```

### Troubleshooting

Error: `cat: jwtRS256.key: No such file or directory`

Make sure you have generated jwtRS256.key & jwtRS256.key.pub using the above section and make sure they're in the gateway/ folder

Error:  `data and hash arguments required`

Delete the UsersDb file from gateway/packages/server/db and run the command again

### Deploying your changes on dev

Prerequisites:
- Make sure you have access to google cloud and if not get help from devops team.
- Connect to the dev vpn

Run the following commands to deploy the latest changes from your Pull Request -  
- `gcloud container clusters get-credentials centrifuge-dev --zone europe-west3-a --project peak-vista-185616`
- `kubectl rollout restart deploy gateway-0 --namespace catalyst`

### Logs
- `kubectl logs -f podname -n catalyst`