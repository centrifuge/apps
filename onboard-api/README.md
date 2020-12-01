# onboard-api

## Env

Generate a private key for the session cookies:
`openssl genrsa -aes256 -out private.pem 2048`

And a public key:
`openssl rsa -in private.pem -outform PEM -pubout -out public.pem`