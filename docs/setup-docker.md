# Dockerized setup

The setup guide to integrate `Jitsi Keycloak Adapter` with a Dockerized Jitsi
setup.

This guide assumes that you have already a working `Jitsi` on a Docker
environment. See
[Jitsi Meet Handbook](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-docker/)
for further details.

Tested with Jitsi `stable-8719` images.

## 1. Keycloak Adapter

```bash
docker run -d \
  -e KEYCLOAK_ORIGIN=https://ucs-sso-ng.mykeycloak.tld \
  -e KEYCLOAK_REALM=myrealm \
  -e KEYCLOAK_CLIENT_ID=myclientid \
  -e JWT_APP_ID=myappid \
  -e JWT_APP_SECRET=myappsecret \
  -e ALLOW_UNSECURE_CERT=true \
  ghcr.io/nordeck/jitsi-keycloak-adapter
```

`JWT_APP_ID` and `JWT_APP_SECRET` must be the same for both `keycloak-adapter`
and `jitsi`.

Set `ALLOW_UNSECURE_CERT` as `true` if `Keycloak` has not a trusted certificate.
For the production environment, `Keycloak` should have a trusted certificate and
this value should be `false`.(_it is `false` by default_)

## 2. Token authentication

Set the following environment variables to enable the token authentication for
`Jitsi`:

- Enable authentication

  `ENABLE_AUTH=1`

- Select the authentication type

  `AUTH_TYPE=jwt`

- Application identifier

  `JWT_APP_ID=myappid`

- Application secret known only to your token generator (_such as_
  `keycloak-adapter`)

  `JWT_APP_SECRET=myappsecret`

## 3. Guest users

Set the following environment variables to allow guest users to join the meeting
after it's created by a moderator:

- Enable guest access

  `ENABLE_GUESTS=1`

- Disable auto login

  `ENABLE_AUTO_LOGIN=0`

- Allow anonymous users with no JWT

  `JWT_ALLOW_EMPTY=1`

- Select the authentication type for `jicofo`

  `AUTH_TYPE=internal`

- Select the authentication type for `prosody`

  `AUTH_TYPE=jwt`
