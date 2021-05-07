# `server`

## Getting started

### Running locally

Run `cp .env.example .env`, generate JWT private/public keys as outlined below, and put the values into `.env`. Make sure to replace all line breaks with `\n`.

Gateway requires a Centrifuge Node to run. Either connect via VPN to a deployed node, or see [here](https://developer.centrifuge.io/cent-node/overview/introduction/), how to set-up and configure a Centrifuge Node and interact with it. If running your own node, make sure you configure the node's webhooks to call your future Gateway instance. By default this will be `localhost:3001/webhooks`.

#### Connect with deployed Amber node

```
NODE_ENV=production ETH_NETWORK=kovan ETH_PROVIDER=https://kovan.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5 CENTRIFUGE_URL=http://34.89.251.225:8082 CENTRIFUGE_ADMIN_ACCOUNT=0x0A735602a357802f553113F5831FE2fbf2F0E2e0 yarn start
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
